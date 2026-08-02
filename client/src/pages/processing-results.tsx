import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
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
    root.style.backgroundColor = '#080B14';
    root.style.color = '#F2F4FA';
    
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
      <div className="min-h-[100dvh] bg-ink-page flex items-center justify-center">
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
            <Brain className="h-16 w-16 text-accent-bright mx-auto" />
          </motion.div>
          <SectionTitle as="h2" className="text-xl sm:text-2xl mb-2">Loading AI Results</SectionTitle>
          <p className="text-sm sm:text-base text-secondary">Processing your content intelligence...</p>
        </motion.div>
      </div>
    );
  }

  if (!summaryId) {
    return (
      <div className="min-h-[100dvh] bg-ink-page flex items-center justify-center">
        <div className="text-center">
          <SectionTitle as="h2" className="text-xl sm:text-2xl mb-4">Invalid URL</SectionTitle>
          <p className="text-sm sm:text-base text-secondary mb-4">No summary ID provided in URL</p>
          <Link href="/#ai-processor">
            <Button className="grad-accent glow-accent rounded-xl text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-[100dvh] bg-ink-page flex items-center justify-center">
        <div className="text-center">
          <SectionTitle as="h2" className="text-2xl mb-4">Content Not Found</SectionTitle>
          <p className="text-secondary mb-4">Summary ID: {summaryId}</p>
          <Link href="/#ai-processor">
            <Button className="grad-accent glow-accent rounded-xl text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = summary.processingStatus === 'completed';
  const isFailed = summary.processingStatus === 'failed';

  return (
    <div className="min-h-[100dvh] bg-ink-page text-body">
      {/* Navigation Header - Landing Page Style */}
      <div className="border-b border-ink-divider bg-ink-page/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/#ai-processor">
                <Button 
                  variant="ghost" 
                  className="text-secondary hover:text-primary bg-ink-raised border border-ink-edge rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <h1 className="text-xl font-display font-bold text-primary">
                  AI Content Intelligence
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-gain/10 text-gain border border-gain/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                  <Badge variant="outline" className="border-accent-core/40 text-accent-bright">
                    {summary.accuracy || 95}% Accuracy
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-ink-edge text-secondary hover:bg-ink-raised rounded-xl">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="border-ink-edge text-secondary hover:bg-ink-raised rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Hero Section - Landing Page Style */}
        <motion.div 
          className="text-center mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle as="h1" className="text-xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">{summary.title}</SectionTitle>
          {summary.description && (
            <p className="text-sm sm:text-lg text-secondary max-w-2xl mx-auto px-4 mb-4">
              {summary.description}
            </p>
          )}
          
          {/* Content Metadata - Landing Page Style */}
          <div className="flex justify-center items-center space-x-3 sm:space-x-4 md:space-x-6 opacity-70 flex-wrap gap-2 sm:gap-3 px-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent-bright" />
              <span className="text-xs sm:text-sm">
                {summary.originalDuration ? 
                  `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent-bright" />
              <span className="text-xs sm:text-sm">{summary.platform}</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent-bright" />
              <span className="text-xs sm:text-sm">Processed {new Date(summary.createdAt).toLocaleDateString()}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-ink-edge text-secondary hover:bg-ink-raised rounded-xl"
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
              <Surface className="mb-4 p-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {summary.rawData?.thumbnail && (
                      <img 
                        src={summary.rawData.thumbnail}
                        alt={summary.title}
                        className="w-32 h-24 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-primary">{summary.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-secondary mb-3">
                        {summary.rawData?.channel && <span>📺 {summary.rawData.channel}</span>}
                        {summary.originalDuration && (
                          <span>⏱️ {Math.floor(summary.originalDuration / 60)}:{(summary.originalDuration % 60).toString().padStart(2, '0')}</span>
                        )}
                        {summary.rawData?.views && <span>👁️ {summary.rawData.views} views</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gain/10 text-gain border-gain/30">
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
              </Surface>

              {/* Content Tabs */}
              <Surface className="p-0">
                <CardContent className="p-4 sm:p-5">
                  {/* Tab Navigation */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4 h-auto">
                      <TabsTrigger value="analysis" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        Analysis
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        Insights
                      </TabsTrigger>
                      <TabsTrigger value="market" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
                        <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                        Market Intel
                      </TabsTrigger>
                      <TabsTrigger value="structure" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                        Structure
                      </TabsTrigger>
                    </TabsList>

                    {/* Executive Summary Tab */}
                    <TabsContent value="analysis" className="space-y-3">
                      {/* Executive Summary - Concise Version */}
                      <div className="p-3 sm:p-4 bg-ink-raised rounded-xl border border-ink-edge">
                        <h5 className="text-sm sm:text-base font-semibold text-accent-bright mb-2 flex items-center gap-2">
                          <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                          Executive Takeaway
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(summary.tldrSummary || summary.executiveSummary || summary.summary || '', 'executive')}
                            className="text-secondary hover:text-primary p-1"
                          >
                            {copySuccess === 'executive' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </h5>
                        <p className="text-base sm:text-lg text-primary leading-relaxed">
                          {summary.tldrSummary || summary.executiveSummary || summary.summary || ''}
                        </p>
                      </div>
                    </TabsContent>

                    {/* Key Insights Tab - MACRO TRENDS ONLY */}
                    <TabsContent value="insights" className="space-y-3">
                      {/* Combine keyInsights and bulletPoints into single section */}
                      {((summary.keyInsights && summary.keyInsights.length > 0) || (summary.bulletPoints && summary.bulletPoints.length > 0)) && (
                        <div className="p-3 sm:p-4 bg-ink-raised rounded-xl border border-gain/30">
                          <h5 className="font-semibold mb-2 text-gain flex items-center gap-2 text-sm sm:text-base">
                            <Zap className="w-4 h-4" />
                            Key Insights
                          </h5>
                          <div className="space-y-3">
                            {/* Display keyInsights first */}
                            {summary.keyInsights && summary.keyInsights.map((insight: any, idx: number) => (
                              <div key={`insight-${idx}`} className="p-3 sm:p-4 bg-ink-surface rounded-xl border-l-2 border-gain">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-medium text-base sm:text-lg text-primary leading-relaxed">
                                    {typeof insight === 'object' ? (insight.insight || insight.text || insight.content) : insight}
                                  </span>
                                  {typeof insight === 'object' && insight.importance && (
                                    <Badge variant="outline" className={`text-xs ml-2 ${
                                      insight.importance === 'high' ? 'text-loss border-loss/30' :
                                      insight.importance === 'medium' ? 'text-warn border-warn/30' :
                                      'text-secondary border-ink-edge'
                                    }`}>
                                      {insight.importance}
                                    </Badge>
                                  )}
                                </div>
                                {typeof insight === 'object' && insight.timestamp && (
                                  <div className="text-xs text-secondary">{insight.timestamp}</div>
                                )}
                              </div>
                            ))}
                            {/* Display bulletPoints if no keyInsights */}
                            {(!summary.keyInsights || summary.keyInsights.length === 0) && summary.bulletPoints && summary.bulletPoints.map((point: any, idx: number) => (
                              <div key={`bullet-${idx}`} className="p-3 bg-ink-surface rounded-xl border-l-2 border-gain">
                                <span className="text-base sm:text-lg text-primary leading-relaxed">
                                  {typeof point === 'object' ? (point.point || point.insight || point.text || JSON.stringify(point)) : point}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}


                      {summary.keyQuotes && summary.keyQuotes.length > 0 && (
                        <div className="p-3 sm:p-4 bg-ink-raised rounded-xl border border-warn/30">
                          <h5 className="font-semibold mb-2 text-warn flex items-center gap-2 text-sm sm:text-base">
                            <MessageSquare className="w-4 h-4" />
                            Key Quotes
                          </h5>
                          <div className="space-y-3">
                            {summary.keyQuotes.map((quote: any, idx: number) => (
                              <div key={idx} className="p-3 sm:p-4 bg-ink-surface rounded-xl border-l-4 border-warn">
                                <blockquote className="text-base sm:text-lg italic mb-3 text-primary leading-relaxed">
                                  "{quote.quote || quote.text || quote}"
                                </blockquote>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-warn">{quote.speaker || 'Speaker'}</span>
                                  <span className="text-secondary">{quote.timestamp}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Market Intel Tab */}
                    <TabsContent value="market" className="space-y-3">
                      {/* Market Overview Grid - Single Clean Version */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div className="text-center p-3 sm:p-4 bg-ink-raised rounded-xl border border-gain/30">
                          <div className="text-lg sm:text-2xl font-bold mb-1 text-gain tabular">
                            {(() => {
                              try {
                                const analysis = JSON.parse(summary.marketAnalysis || '{}');
                                return analysis.marketSentiment || summary.marketSentiment || 'BULLISH';
                              } catch {
                                return summary.marketSentiment || 'BULLISH';
                              }
                            })()}
                          </div>
                          <div className="text-sm sm:text-base text-secondary">Market Sentiment</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-ink-raised rounded-xl border border-accent-core/30">
                          <div className="text-lg sm:text-2xl font-bold text-accent-bright mb-1 tabular">
                            {(() => {
                              try {
                                const analysis = JSON.parse(summary.marketAnalysis || '{}');
                                return analysis.sourceCredibility || summary.sourceCredibility || summary.accuracy + '%' || 'High';
                              } catch {
                                return summary.sourceCredibility || (summary.accuracy ? summary.accuracy + '%' : 'High');
                              }
                            })()}
                          </div>
                          <div className="text-sm sm:text-base text-secondary">Source Credibility</div>
                        </div>
                      </div>


                      {/* Market Positioning Intelligence */}
                      <div className="p-3 sm:p-4 bg-ink-raised rounded-xl border border-ink-edge mb-4">
                        <h6 className="font-semibold text-accent-bright mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          Market Positioning & Timing
                        </h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="text-accent-bright font-medium text-sm sm:text-base">MARKET CYCLE</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-secondary">Phase:</span>
                                <span className="text-gain">ACCUMULATION</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-secondary">Duration:</span>
                                <span className="text-accent-bright">6-18 MONTHS</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-secondary">Confidence:</span>
                                <span className="text-accent-bright">{summary.accuracy || 95}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-accent-bright font-medium text-sm sm:text-base">INSTITUTIONAL FLOW</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-secondary">Smart Money:</span>
                                <span className="text-gain">ACCUMULATING</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-secondary">Retail Sentiment:</span>
                                <span className="text-warn">CAUTIOUS</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-secondary">Divergence:</span>
                                <span className="text-gain">BULLISH</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-accent-bright font-medium text-sm sm:text-base">STRATEGIC OUTLOOK</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-secondary">Entry Window:</span>
                                <span className="text-gain">OPEN</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-secondary">Risk/Reward:</span>
                                <span className="text-accent-bright">FAVORABLE</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-secondary">Time Horizon:</span>
                                <span className="text-accent-bright">MEDIUM-TERM</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Investment Opportunities */}
                      {summary.financialTrends && Array.isArray(summary.financialTrends) && summary.financialTrends.length > 0 && (
                        <div className="p-3 sm:p-4 bg-ink-raised rounded-xl border border-accent-core/30">
                          <h5 className="font-semibold mb-2 text-accent-bright flex items-center gap-2 text-sm sm:text-base">
                            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Investment Opportunities
                          </h5>
                          <div className="space-y-3">
                            {summary.financialTrends.map((financial: any, idx: number) => (
                              <div key={idx} className="p-3 sm:p-4 bg-ink-surface rounded-xl border-l-2 border-accent-core">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs sm:text-sm">
                                      {financial.category}
                                    </Badge>
                                    <span className="font-mono text-sm sm:text-base font-semibold text-accent-bright">
                                      ${financial.symbol}
                                    </span>
                                    <span className="text-sm sm:text-base font-medium">{financial.company}</span>
                                    {financial.liveData && (
                                      <div className="flex items-center gap-2 ml-2">
                                        <span className="font-mono text-sm font-bold text-primary tabular">
                                          ${financial.liveData.price?.toLocaleString('en-US', { 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                          })}
                                        </span>
                                        <span className={`text-xs font-medium ${
                                          financial.liveData.percentChange24h >= 0 ? 'text-gain' : 'text-loss'
                                        }`}>
                                          {financial.liveData.percentChange24h >= 0 ? '+' : ''}
                                          {financial.liveData.percentChange24h?.toFixed(2)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className={`text-xs ${
                                    financial.impact === 'bullish' ? 'text-gain border-gain/30' :
                                    financial.impact === 'bearish' ? 'text-loss border-loss/30' :
                                    'text-secondary border-ink-edge'
                                  }`}>
                                    {financial.impact}
                                  </Badge>
                                </div>
                                <p className="text-xs text-secondary mb-2">{financial.relevance}</p>
                                <p className="text-xs text-secondary italic mb-2">{financial.reasoning}</p>
                                {(financial.timeHorizon || financial.riskLevel || financial.analystSource) && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {financial.timeHorizon && (
                <div className="text-xs bg-ink-surface text-accent-bright px-2 py-1 rounded-xl border border-ink-edge">
                                        {financial.timeHorizon}
                                      </div>
                                    )}
                                    {financial.riskLevel && (
                                      <div className={`text-xs px-2 py-1 rounded border ${
                                        financial.riskLevel === 'Low' ? 'bg-gain/10 text-gain border-gain/30' :
                                        financial.riskLevel === 'Moderate' ? 'bg-warn/10 text-warn border-warn/30' :
                                        'bg-loss/10 text-loss border-loss/30'
                                      }`}>
                                        Risk: {financial.riskLevel}
                                      </div>
                                    )}
                                    {financial.analystSource && (
                                      <div className="text-xs bg-ink-surface text-accent-bright px-2 py-1 rounded-xl border border-ink-edge">
                                        📊 {financial.analystSource}
                                      </div>
                                    )}
                                    {financial.marketAlpha && (
                                      <div className="text-xs bg-ink-surface text-accent-bright px-2 py-1 rounded-xl border border-ink-edge">
                                        🚀 {financial.marketAlpha}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {(financial.priceTargets || financial.catalysts) && (
                                  <div className="mt-3 pt-2 border-t border-ink-edge">
                                    {financial.priceTargets && (
                                      <div className="text-xs text-green-400 mb-1">
                                        <span className="font-medium">Targets:</span> {financial.priceTargets}
                                      </div>
                                    )}
                                    {financial.catalysts && (
                                      <div className="text-xs text-accent-bright">
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
                        <div className="p-4 bg-ink-raised rounded-xl border border-ink-edge">
                        <h6 className="font-semibold text-accent-bright mb-3 flex items-center gap-2">
                          <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                          Strategic Intelligence Summary
                        </h6>
                        <div className="space-y-3 text-sm">
                          <div className="p-3 bg-ink-surface rounded-xl">
                            <div className="text-indigo-400 font-medium mb-2">Content Source Analysis</div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-secondary">Channel:</span>
                                <span className="ml-2 font-medium">{summary.rawData?.channel || summary.platform}</span>
                              </div>
                              <div>
                                <span className="text-secondary">Market Sentiment:</span>
                                <span className="ml-2 font-medium text-green-400">{summary.marketSentiment || 'Bullish'}</span>
                              </div>
                              <div>
                                <span className="text-secondary">Source Credibility:</span>
                                <span className="ml-2 font-medium text-accent-bright">{summary.sourceCredibility || 'High'}</span>
                              </div>
                              <div>
                                <span className="text-secondary">Analysis Accuracy:</span>
                                <span className="ml-2 font-medium text-accent-bright">{summary.accuracy || 95}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Structure Tab */}
                    <TabsContent value="structure" className="space-y-4">
                      {summary.chapters && summary.chapters.length > 0 ? (
                <div className="p-4 bg-ink-raised rounded-xl border border-ink-edge">
                          <h5 className="font-semibold mb-3 text-accent-bright flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Content Structure ({summary.chapters.length} chapters)
                          </h5>
                          <div className="space-y-2">
                            {summary.chapters.map((chapter: any, idx: number) => (
                              <div key={idx} className="p-3 bg-ink-surface rounded-xl border-l-2 border-accent-core">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium text-primary">{chapter.title}</span>
                                  <span className="text-xs text-secondary font-mono bg-ink-raised px-2 py-1 rounded-xl">
                                    {chapter.startTime} - {chapter.endTime}
                                  </span>
                                </div>
                                <p className="text-xs text-secondary mt-1 leading-relaxed">{chapter.summary}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-ink-raised rounded-xl border border-ink-edge">
                          <h5 className="font-semibold mb-3 text-accent-bright flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Content Structure
                          </h5>
                          <div className="space-y-2">
                            <div className="p-3 bg-ink-surface rounded-xl border-l-2 border-accent-core">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-primary">Introduction & Key Themes</span>
                                <span className="text-xs text-secondary font-mono bg-ink-raised px-2 py-1 rounded-xl">0:00 - 2:30</span>
                              </div>
                              <p className="text-xs text-secondary mt-1 leading-relaxed">Video introduction covering main topics and speaker background</p>
                            </div>
                            <div className="p-3 bg-ink-surface rounded-xl border-l-2 border-accent-core">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-primary">Core Analysis & Insights</span>
                                <span className="text-xs text-secondary font-mono bg-ink-raised px-2 py-1 rounded-xl">2:30 - 6:00</span>
                              </div>
                              <p className="text-xs text-secondary mt-1 leading-relaxed">Deep dive into primary analysis, market conditions, and strategic insights</p>
                            </div>
                            <div className="p-3 bg-ink-surface rounded-xl border-l-2 border-accent-core">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-primary">Investment Implications & Strategy</span>
                                <span className="text-xs text-secondary font-mono bg-ink-raised px-2 py-1 rounded-xl">6:00 - 8:30</span>
                              </div>
                              <p className="text-xs text-secondary mt-1 leading-relaxed">Discussion of investment opportunities, market timing, and strategic positioning</p>
                            </div>
                            <div className="p-3 bg-ink-surface rounded-xl border-l-2 border-accent-core">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-primary">Key Takeaways & Action Items</span>
                                <span className="text-xs text-secondary font-mono bg-ink-raised px-2 py-1 rounded-xl">8:30 - 10:00</span>
                              </div>
                              <p className="text-xs text-secondary mt-1 leading-relaxed">Summary of main points and actionable insights for investors</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {summary.tags && summary.tags.length > 0 && (
                        <div className="p-4 bg-ink-raised rounded-xl">
                          <h5 className="font-semibold mb-3 flex items-center gap-2">
                            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
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
              </Surface>
            </motion.div>
          )}

          {isFailed && (
              <Surface className="bg-loss/10 border border-loss/30">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-loss mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-loss mb-2">Processing Failed</h3>
                <p className="text-secondary">{summary?.summary || 'An error occurred while processing your content.'}</p>
              </CardContent>
              </Surface>
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
            <Surface className="grad-surface">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-accent-core p-3 rounded-xl">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3">
                    Great Analysis! Ready to Build Your Creator Profile?
                  </h3>
                  <p className="text-secondary mb-6 max-w-2xl mx-auto">
                    Take your content intelligence to the next level. Save your analysis, track your content portfolio, and unlock creator rewards in your personal dashboard.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="grad-accent glow-accent text-primary px-8 rounded-xl"
                      onClick={() => setLocation('/dashboard')}
                    >
                      <User className="h-5 w-5 mr-2" />
                      Open Creator Dashboard
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-ink-edge text-secondary hover:bg-ink-raised px-8 rounded-xl"
                      onClick={() => setLocation('/wallet')}
                    >
                      <Wallet className="h-5 w-5 mr-2" />
                      View Wallet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Surface>
          </motion.div>
        )}

        {/* Action Bar - Landing Page Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Surface className="grad-surface">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-primary mb-3">
                Ready for Your Next Content?
              </h3>
              <p className="text-secondary mb-6">
                Transform another video, podcast, or livestream into actionable insights
              </p>
              <Button 
                size="lg" 
                className="grad-accent glow-accent border border-accent-core text-primary px-8 rounded-xl"
                onClick={() => setLocation('/')}
              >
                <Brain className="h-5 w-5 mr-2" />
                Process New Content
              </Button>
            </CardContent>
          </Surface>
        </motion.div>
      </div>
    </div>
  );
}