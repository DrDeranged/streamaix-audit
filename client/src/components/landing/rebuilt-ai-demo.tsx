import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import UserNotesModal from '@/components/UserNotesModal';
import { EnhancedPredictionMarketCard } from '@/components/prediction/EnhancedPredictionMarketCard';
import { 
  Brain, 
  Zap, 
  Clock, 
  Eye,
  TrendingUp,
  MessageSquare,
  MessageCircle,
  Users,
  Heart,
  Repeat2,
  Calendar,
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Play,
  ExternalLink,
  BarChart3,
  FileText,
  Target,
  Sparkles,
  TrendingUp as TrendingUpIcon,
  Edit3,
  Plus,
  BookmarkPlus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface ProcessingResult {
  id: string;
  title: string;
  summary: string;
  tldrSummary: string;
  executiveSummary: string;
  bulletPoints: string[];
  trends: Array<{
    trend: string;
    strength: 'strong' | 'moderate' | 'weak';
    evidence: string;
  }>;
  financialTrends: Array<{
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
  marketSentiment: string;
  sourceCredibility: string;
  keyQuotes: Array<{
    quote: string;
    speaker: string;
    timestamp: string;
  }>;
  chapters: Array<{
    title: string;
    startTime: string;
    endTime: string;
    summary: string;
  }>;
  tags: string[];
  accuracy: number;
  processingStatus: string;
  suggestedMarkets?: Array<{
    id?: string;
    question: string;
    category?: string;
    deadline?: string;  // Database uses 'deadline', not 'endDate'
    endDate?: string;   // Keep for backward compatibility
    yesPrice?: number;
    confidence?: number;
    description?: string;
    tags?: string[];
    rationale?: string;
    resolutionSource?: string;
  }>;
  rawData: {
    title: string;
    channel: string;
    duration: string;
    views: string;
    thumbnail: string;
  };
}


export function AIProcessor() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  const [statusTimeouts, setStatusTimeouts] = useState<NodeJS.Timeout[]>([]);
  const [lastError, setLastError] = useState<any>(null);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Query for processing result with real-time updates
  const { data: result, isLoading: isResultLoading, error } = useQuery<ProcessingResult>({
    queryKey: ['/api/processing-result', summaryId],
    enabled: !!summaryId,
    refetchInterval: (query) => {
      return query.state.data?.processingStatus === 'processing' ? 1500 : false;
    },
  });

  // 🔍 DEBUG: Log suggestedMarkets data when result changes
  useEffect(() => {
    if (result) {
      // CRITICAL FIX: Ensure suggestedMarkets is always an array on frontend
      let safeSuggestedMarkets: any[] = [];
      if (result.suggestedMarkets) {
        if (Array.isArray(result.suggestedMarkets)) {
          safeSuggestedMarkets = result.suggestedMarkets;
        } else if (typeof result.suggestedMarkets === 'object') {
          // Convert object to empty array (shouldn't happen with backend fix, but defensive)
          safeSuggestedMarkets = [];
        }
      }
      
      console.log('🔍 [Frontend] Processing result received:', {
        summaryId: result.id,
        processingStatus: result.processingStatus,
        rawSuggestedMarkets: result.suggestedMarkets,
        suggestedMarketsType: typeof result.suggestedMarkets,
        isArray: Array.isArray(result.suggestedMarkets),
        safeSuggestedMarketsCount: safeSuggestedMarkets.length,
        firstMarket: safeSuggestedMarkets[0]?.question || 'N/A'
      });
      
      // Override result.suggestedMarkets with safe version if needed
      if (!Array.isArray(result.suggestedMarkets) && result.suggestedMarkets) {
        result.suggestedMarkets = safeSuggestedMarkets as any;
      }
    }
  }, [result]);

  // Immediately clean up when processing completes
  useEffect(() => {
    if (result?.processingStatus === 'completed' || result?.processingStatus === 'failed') {
      // Clear progress interval immediately
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
      
      // Clear all status timeouts
      statusTimeouts.forEach(timeout => clearTimeout(timeout));
      setStatusTimeouts([]);
      
      // Set final progress and stop processing state
      setProgress(100);
      setIsProcessing(false);
      
      if (result.processingStatus === 'completed') {
        setProcessingStatus('Analysis complete!');
      }
    }
  }, [result?.processingStatus]);

  // Handle URL parameters for prefilled content and autostart
  useEffect(() => {
    const handleHashParams = () => {
      const hash = window.location.hash;
      if (hash.includes('ai-processor')) {
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const urlParam = params.get('url');
        const autostart = params.get('autostart');
        
        if (urlParam) {
          const decodedUrl = decodeURIComponent(urlParam);
          setUrl(decodedUrl);
          
          if (autostart === 'true' && !isProcessing && !summaryId) {
            // Auto-start processing after URL is set
            setTimeout(() => {
              handleProcessWithUrl(decodedUrl);
            }, 500);
          }
        }
      }
    };

    // Handle initial load
    handleHashParams();
    
    // Handle hash changes
    window.addEventListener('hashchange', handleHashParams);
    
    return () => {
      window.removeEventListener('hashchange', handleHashParams);
    };
  }, [isProcessing, summaryId]);

  // Helper function to process with a specific URL (for auto-start)
  const handleProcessWithUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL to process.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus('Starting AI analysis...');
    setLastError(null); // Clear previous errors
    
    try {
      // Make raw fetch to capture full response details
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      // Capture response headers for diagnostics
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: response.statusText }));
        const detailedError = {
          status: response.status,
          statusText: response.statusText,
          headers,
          body: errorBody,
          url: '/api/analyze-content',
          timestamp: new Date().toISOString(),
        };
        setLastError(detailedError);
        throw new Error(errorBody.error || errorBody.message || `${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSummaryId(data.summaryId);
      
      // Simulate progress updates
      const newProgressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 12;
        });
      }, 800);
      setProgressInterval(newProgressInterval);

      // Update status messages with cleanup tracking
      const timeouts = [
        setTimeout(() => setProcessingStatus('Extracting video metadata...'), 1000),
        setTimeout(() => setProcessingStatus('Analyzing content with AI...'), 3000),
        setTimeout(() => setProcessingStatus('Generating market insights...'), 6000),
        setTimeout(() => setProcessingStatus('Finalizing analysis...'), 8000)
      ];
      setStatusTimeouts(timeouts);

      toast({
        title: "Processing Started",
        description: "Your content is being analyzed by AI...",
        variant: "default"
      });
    } catch (error: any) {
      console.error('🔴 Processing error:', error);
      console.error('🔴 Error details:', lastError);
      toast({
        title: "Unable to process content",
        description: "Please check the URL and try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    return handleProcessWithUrl(url);
  };

  const isCompleted = result?.processingStatus === 'completed';
  const isFailed = result?.processingStatus === 'failed';


  return (
    <section id="ai-processor" className="pt-20 pb-16 bg-transparent">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <SectionTitle as="h1">Live AI Processing</SectionTitle>
          <p className="mt-2 text-body">Paste a YouTube URL and extract AI insights instantly</p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-ink-surface bg-ink-surface backdrop-blur-xl border border-ink-edge border-accent-core/30 rounded-2xl p-6 shadow-lg shadow-accent-core/10">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-base bg-ink-surface bg-ink-raised border-ink-edge border-ink-edge focus:border-accent-core transition-colors"
                  disabled={isProcessing}
                  data-testid="input-youtube-url"
                />
                <Button 
                  onClick={handleProcess}
                  disabled={isProcessing || !url.trim()}
                  className="h-12 px-8 grad-accent  font-medium"
                  data-testid="button-analyze"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {lastError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <Surface className="border-loss/50 bg-loss/10">
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-loss" />
                      <SectionTitle as="h3" className="text-loss">Request Failed</SectionTitle>
                      <Badge variant="destructive" className="ml-auto">
                        {lastError.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-loss">Server Response:</div>
                      <pre className="text-xs bg-ink-page p-3 rounded overflow-x-auto">
                        {JSON.stringify(lastError.body, null, 2)}
                      </pre>
                    </div>
                    
                    {lastError.headers['x-server-version'] && (
                      <div className="bg-accent-core/10 p-2 rounded text-xs space-y-1">
                        <div className="text-accent-bright font-semibold">Server Info:</div>
                        <div className="font-mono text-[10px] space-y-0.5">
                          <div>Version: {lastError.headers['x-server-version']}</div>
                          <div>Build: {lastError.headers['x-server-build-time']}</div>
                          <div>Env: {lastError.headers['x-server-node-env']}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-[10px] text-secondary">
                      Failed at: {new Date(lastError.timestamp).toLocaleString()}
                    </div>
                  </div>
                </Surface>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Status */}
          <AnimatePresence>
            {(isProcessing || summaryId) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Progress Card */}
                {isProcessing && (
                  <Surface className="mb-6 bg-ink-surface bg-ink-surface backdrop-blur-xl border border-ink-edge border-accent-core/30">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-accent-core/20 flex items-center justify-center">
                              <Brain className="h-5 w-5 text-accent-bright animate-pulse" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-primary ">AI Processing Active</h3>
                            <p className="text-sm text-secondary ">{processingStatus}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                          {Math.round(progress)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-ink-raised rounded-xl h-2">
                        <div 
                          className="bg-ink-surface   h-2 rounded-xl transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </Surface>
                )}

                {/* Results Content */}
                {isCompleted && result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Header Card */}
                    <Surface className="mb-6 bg-ink-surface bg-ink-surface backdrop-blur-xl border border-ink-edge border-accent-core/30">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <img 
                            src={result.rawData?.thumbnail}
                            alt={result.title}
                            className="w-32 h-24 object-cover rounded-xl"
                          />
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-primary  mb-2">{result.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-secondary  mb-3">
                              <span>📺 {result.rawData?.channel}</span>
                              <span>⏱️ {result.rawData?.duration}</span>
                              <span>👁️ {result.rawData?.views} views</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-gain/20 text-gain border-gain/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                              <Badge variant="outline">
                                {result.accuracy}% Accuracy
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Source
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Surface>

                    {/* Content Tabs */}
                    <Surface className="bg-ink-surface bg-ink-surface backdrop-blur-xl border border-ink-edge border-accent-core/30">
                      <div className="p-6">
                        <Tabs defaultValue="summary" className="w-full">
                          <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="summary" className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Summary
                            </TabsTrigger>
                            <TabsTrigger value="insights" className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Insights
                            </TabsTrigger>
                            <TabsTrigger value="market" className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Market Intel
                            </TabsTrigger>
                            <TabsTrigger value="structure" className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Structure
                            </TabsTrigger>
                          </TabsList>

                          {/* Summary Tab */}
                          <TabsContent value="summary" className="space-y-4">
                            <div className="p-4 bg-ink-surface   rounded-xl border border-accent-core/20">
                              <h5 className="text-lg font-semibold text-accent-bright mb-3 flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Executive Takeaway
                              </h5>
                              <p className="text-body leading-relaxed text-base">{result.tldrSummary}</p>
                            </div>
                          </TabsContent>

                          {/* Insights Tab */}
                          <TabsContent value="insights" className="space-y-4">
                            {result.bulletPoints && result.bulletPoints.length > 0 && (
                              <div className="p-4 bg-gain/10 rounded-xl border border-gain/20">
                                <h5 className="font-semibold mb-3 text-gain flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Key Insights
                                </h5>
                                <div className="space-y-2">
                                  {result.bulletPoints.map((point: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 p-3 bg-ink-raised rounded-xl">
                                      <span className="font-medium text-gain text-sm mt-0.5">•</span>
                                      <span className="text-sm text-body ">{point}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.trends && result.trends.length > 0 && (
                              <div className="p-4 bg-accent-core/10 rounded-xl border border-accent-core/20">
                                <h5 className="font-semibold mb-3 text-accent-bright flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Market Trends
                                </h5>
                                <div className="space-y-3">
                                  {result.trends.map((trend: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-ink-raised rounded-xl">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm text-primary ">{trend.trend}</span>
                                        <Badge variant="outline" className={`text-xs ${
                                          trend.strength === 'strong' ? 'text-gain border-gain/30' :
                                          trend.strength === 'moderate' ? 'text-warn border-warn/30' :
                                          'text-muted border-ink-edge'
                                        }`}>
                                          {trend.strength}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-secondary ">{trend.evidence}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}


                            {result.keyQuotes && result.keyQuotes.length > 0 && (
                              <div className="p-4 bg-warn/10 rounded-xl border border-warn/20">
                                <h5 className="font-semibold mb-3 text-warn flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" />
                                  Key Quotes
                                </h5>
                                <div className="space-y-3">
                                  {result.keyQuotes.map((quote: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-ink-raised rounded-xl border-l-2 border-warn">
                                      <p className="text-sm italic mb-2">"{quote.quote}"</p>
                                      <div className="flex items-center justify-between text-xs text-secondary">
                                        <span>{quote.speaker}</span>
                                        <span>{quote.timestamp}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TabsContent>

                          {/* Market Intel Tab */}
                          <TabsContent value="market" className="space-y-4">
                            {/* Market Overview Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="text-center p-4 bg-ink-surface   rounded-xl border border-gain/20">
                                <div className="text-2xl font-bold mb-1 text-gain">
                                  {result.marketSentiment}
                                </div>
                                <div className="text-xs text-secondary">Market Sentiment</div>
                              </div>
                              <div className="text-center p-4 bg-ink-surface   rounded-xl border border-accent-core/20">
                                <div className="text-2xl font-bold text-accent-bright mb-1">
                                  {result.sourceCredibility}
                                </div>
                                <div className="text-xs text-secondary">Source Credibility</div>
                              </div>
                            </div>



                            {/* REMOVED HARDCODED TEMPLATE DATA - Only show real content-based analysis */}

                            {/* Content Source Intelligence - REAL DATA ONLY */}
                            <div className="p-4 bg-ink-surface   rounded-xl border border-accent-core/20">
                              <h6 className="font-semibold text-accent-bright mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Content Source Analysis
                              </h6>
                              <div className="space-y-3 text-sm">
                                <div className="p-3 bg-ink-raised rounded-xl">
                                  <div className="text-accent-bright font-medium mb-2">Source Information</div>
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="text-secondary ">Channel:</span>
                                      <span className="ml-2 font-medium text-primary  ">{result.rawData?.channel || 'Content Creator'}</span>
                                    </div>
                                    <div>
                                      <span className="text-secondary ">Market Sentiment:</span>
                                      <span className="ml-2 font-medium text-gain ">{result.marketSentiment || 'NEUTRAL'}</span>
                                    </div>
                                    <div>
                                      <span className="text-secondary ">Source Credibility:</span>
                                      <span className="ml-2 font-medium text-accent-bright">{result.sourceCredibility || 'Medium'}</span>
                                    </div>
                                    <div>
                                      <span className="text-secondary ">Analysis Accuracy:</span>
                                      <span className="ml-2 font-medium text-accent-bright">{result.accuracy || 85}%</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-secondary  text-sm">
                                  This analysis extracts specific market intelligence from "{result.rawData?.title || 'the processed content'}" by {result.rawData?.channel || 'this source'}. 
                                  All financial recommendations and trends are directly derived from the actual content discussion.
                                </div>
                              </div>
                            </div>

                            {/* REAL FINANCIAL INVESTMENT OPPORTUNITIES */}
                            {result.financialTrends && Array.isArray(result.financialTrends) && result.financialTrends.length > 0 && (
                              <div className="p-4 bg-ink-surface   rounded-xl border border-gain/20">
                                <h6 className="font-semibold text-gain mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Investment Opportunities from Content Analysis
                                </h6>
                                <div className="space-y-3">
                                  {result.financialTrends
                                    .filter((financial: any, index: number, array: any[]) => 
                                      // Remove duplicates by symbol
                                      array.findIndex(item => item.symbol === financial.symbol) === index
                                    )
                                    .map((financial: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-ink-raised rounded-xl border-l-2 border-gain">
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary" className="text-xs">
                                              {financial.category}
                                            </Badge>
                                            <span className="font-mono text-sm font-semibold text-gain">
                                              ${financial.symbol}
                                            </span>
                                            <span className="text-sm font-medium text-primary ">{financial.company}</span>
                                          </div>
                                          {financial.liveData && (
                                            <div className="flex items-center gap-3 mt-1 sm:mt-0">
                                              <span className="font-mono text-sm font-bold text-primary  whitespace-nowrap">
                                                ${financial.liveData.price?.toLocaleString('en-US', { 
                                                  minimumFractionDigits: 2, 
                                                  maximumFractionDigits: 2 
                                                })}
                                              </span>
                                              <span className={`text-sm font-medium whitespace-nowrap px-2 py-1 rounded ${
                                                financial.liveData.percentChange24h >= 0 ? 'text-gain bg-gain/10' : 'text-loss bg-loss/10'
                                              }`}>
                                                {financial.liveData.percentChange24h >= 0 ? '+' : ''}
                                                {financial.liveData.percentChange24h?.toFixed(2)}%
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <Badge variant="outline" className={`text-xs self-start sm:self-center ${
                                          financial.impact === 'bullish' ? 'text-gain border-gain/30' :
                                          financial.impact === 'bearish' ? 'text-loss border-loss/30' :
                                          'text-muted border-ink-edge'
                                        }`}>
                                          {financial.impact}
                                        </Badge>
                                      </div>
                                      
                                      {/* Market Alpha - Unique Insights */}
                                      {financial.marketAlpha && (
                                        <div className="text-xs text-warn  mb-2 p-2 bg-warn  rounded border-l-2 border-warn">
                                          <strong>🎯 Market Alpha:</strong> {financial.marketAlpha}
                                        </div>
                                      )}
                                      
                                      {/* Price Targets & Catalysts */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                        {financial.priceTargets && (
                                          <div className="text-xs text-gain p-2 bg-gain/10 rounded-xl">
                                            <strong>🎯 Targets:</strong> {financial.priceTargets}
                                          </div>
                                        )}
                                        {financial.catalysts && (
                                          <div className="text-xs text-accent-bright p-2 bg-accent-core/10 rounded-xl">
                                            <strong>⚡ Catalysts:</strong> {financial.catalysts}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <p className="text-xs text-secondary  mb-2"><strong>Relevance:</strong> {financial.relevance}</p>
                                      <p className="text-xs text-body  italic mb-2"><strong>Investment Thesis:</strong> {financial.reasoning}</p>
                                      {(financial.timeHorizon || financial.riskLevel || financial.analystSource) && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {financial.timeHorizon && (
                                            <div className="text-xs bg-accent-core/10 text-accent-bright px-2 py-1 rounded border border-accent-core/20">
                                              {financial.timeHorizon}
                                            </div>
                                          )}
                                          {financial.riskLevel && (
                                            <div className={`text-xs px-2 py-1 rounded border ${
                                              financial.riskLevel === 'Low' ? 'bg-gain/10 text-gain border-gain/20' :
                                              financial.riskLevel === 'Moderate' ? 'bg-warn/10 text-warn border-warn/20' :
                                              'bg-loss/10 text-loss border-loss/20'
                                            }`}>
                                              Risk: {financial.riskLevel}
                                            </div>
                                          )}
                                          {financial.analystSource && (
                                            <div className="text-xs bg-accent-core/10 text-accent-bright px-2 py-1 rounded border border-accent-core/20">
                                              📊 {financial.analystSource}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* REMOVED HARDCODED COMPETITIVE INTELLIGENCE - Only show real content-based analysis */}
                          </TabsContent>

                          {/* Structure Tab */}
                          <TabsContent value="structure" className="space-y-4">
                            <div className="p-4 bg-accent-core/10 rounded-xl border border-accent-core/20">
                              <h5 className="font-semibold mb-3 text-accent-bright flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Content Structure ({result.chapters?.length || 0} chapters)
                              </h5>
                              <div className="space-y-2">
                                {result.chapters?.map((chapter: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-ink-raised rounded-xl flex justify-between items-start">
                                    <div>
                                      <span className="text-sm font-medium">{chapter.title}</span>
                                      <p className="text-xs text-secondary mt-1">{chapter.summary}</p>
                                    </div>
                                    <span className="text-xs text-secondary font-mono">
                                      {chapter.startTime} - {chapter.endTime}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="p-4 bg-ink-raised rounded-xl">
                              <h5 className="font-semibold mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Content Tags
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {result.tags?.map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs text-body ">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </Surface>

                    {/* User Notes Section */}
                    {isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6"
                      >
                        <Surface className="bg-ink-surface       border border-accent-core/20  overflow-hidden relative">
                          <div className="absolute inset-0 bg-ink-surface   animate-pulse"></div>
                          <div className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-ink-surface   flex items-center justify-center">
                                  <Edit3 className="h-5 w-5 text-primary " />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold bg-ink-surface       text-primary">Add Your Analysis</h4>
                                  <p className="text-sm text-secondary ">Capture insights • Private notes • Dashboard access</p>
                                </div>
                              </div>
                              <Button
                                onClick={() => setShowNotesModal(true)}
                                size="lg"
                                className="grad-accent text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
                                data-testid="button-add-analysis-note"
                              >
                                <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                Add Analysis Note
                                <Edit3 className="h-4 w-4 ml-2 group-hover:animate-pulse" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div className="text-center p-3 bg-ink-surface/10 rounded-xl border border-white/20">
                                <BookmarkPlus className="h-6 w-6 mx-auto mb-2 text-accent-bright" />
                                <p className="text-xs font-medium text-primary ">Footnotes</p>
                                <p className="text-xs text-secondary ">Quick references</p>
                              </div>
                              <div className="text-center p-3 bg-ink-surface/10 rounded-xl border border-white/20">
                                <FileText className="h-6 w-6 mx-auto mb-2 text-accent-bright" />
                                <p className="text-xs font-medium text-primary ">Analysis</p>
                                <p className="text-xs text-secondary ">Detailed insights</p>
                              </div>
                              <div className="text-center p-3 bg-ink-surface/10 rounded-xl border border-white/20">
                                <Sparkles className="h-6 w-6 mx-auto mb-2 text-accent-bright" />
                                <p className="text-xs font-medium text-primary ">Key Insights</p>
                                <p className="text-xs text-secondary ">Important learnings</p>
                              </div>
                            </div>
                          </div>
                        </Surface>
                      </motion.div>
                    )}

                    {/* Dashboard Call-to-Action */}
                    {isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6"
                      >
                        <Surface className="bg-ink-surface       border border-accent-core/20  overflow-hidden relative">
                          <div className="absolute inset-0 bg-ink-surface   animate-pulse"></div>
                          <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-ink-surface   flex items-center justify-center">
                                  <BarChart3 className="h-6 w-6 text-primary " />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold bg-ink-surface       text-primary mb-1">
                                    Maximize Your Insights
                                  </h3>
                                  <p className="text-sm text-secondary">
                                    Share insights, collaborate with experts, build your reputation, and earn rewards along the way
                                  </p>
                                </div>
                              </div>
                              <Link href="/dashboard" data-testid="button-view-dashboard">
                                <Button 
                                  size="lg" 
                                  className="grad-accent  text-primary  font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
                                >
                                  <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                                  View Dashboard
                                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Surface>
                      </motion.div>
                    )}

                    {/* AI-Extracted Prediction Markets - Enhanced Cards */}
                    {result.suggestedMarkets && result.suggestedMarkets.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 space-y-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-ink-surface   flex items-center justify-center">
                              <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold bg-ink-surface     text-primary">
                                AI-Extracted Prediction Markets
                              </h3>
                              <p className="text-sm text-secondary">Trade on predictions extracted from this content</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-accent-core/10 border-accent-core/30 text-accent-bright">
                            {result.suggestedMarkets.length} Markets
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {result.suggestedMarkets.slice(0, 6).map((market: any, idx: number) => (
                            <EnhancedPredictionMarketCard
                              key={idx}
                              market={{
                                id: market.id,
                                question: market.question,
                                description: market.description,
                                category: market.category || 'content',
                                deadline: market.deadline || market.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                yesPrice: market.yesPrice || 5000,
                                noPrice: market.noPrice || 5000,
                                confidence: market.confidence || 70,
                                tags: market.tags,
                                resolutionSource: market.resolutionSource,
                                totalVolume: market.totalVolume || 0,
                                totalTrades: market.totalTrades || 0,
                              }}
                              variant="compact"
                              summaryId={result.id}
                              summaryTitle={result.title}
                            />
                          ))}
                        </div>

                        {result.suggestedMarkets.length > 6 && (
                          <div className="text-center pt-2">
                            <Link href="/markets">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-accent-core/30 hover:bg-accent-core/10 text-accent-bright hover:text-accent-bright transition-all duration-300"
                                data-testid="button-view-all-markets"
                              >
                                View All {result.suggestedMarkets.length} Markets
                                <ArrowRight className="h-3 w-3 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* For Non-Authenticated Users */}
                    {!isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6"
                      >
                        <Surface className="bg-ink-surface    border border-gain/20 overflow-hidden relative">
                          <div className="absolute inset-0 bg-ink-surface   animate-pulse"></div>
                          <div className="p-6 relative">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto rounded-xl bg-ink-surface   flex items-center justify-center mb-4">
                                <TrendingUpIcon className="h-8 w-8 text-primary " />
                              </div>
                              <h3 className="text-xl font-semibold bg-ink-surface    text-primary mb-2">
                                Ready to Unlock Your Full Potential?
                              </h3>
                              <p className="text-secondary mb-6 max-w-md mx-auto">
                                Create your account to save analyses, track trends, and access powerful AI-driven insights across all your content
                              </p>
                              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link href="/auth" data-testid="button-sign-up">
                                  <Button 
                                    size="lg" 
                                    className="grad-accent text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group min-w-[140px]"
                                  >
                                    <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                                    Get Started
                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                  </Button>
                                </Link>
                                <Link href="/auth" data-testid="button-sign-in">
                                  <Button 
                                    variant="outline" 
                                    size="lg" 
                                    className="border-gain/30 text-gain hover:bg-gain/10 hover:text-gain transition-all duration-300 min-w-[140px]"
                                  >
                                    Sign In
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Surface>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {isFailed && (
                  <Surface className="bg-loss/10 border-loss/20">
                    <div className="p-6 text-center">
                      <AlertCircle className="h-12 w-12 text-loss mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-loss mb-2">Processing Failed</h3>
                      <p className="text-secondary">{result?.summary || 'An error occurred while processing your content.'}</p>
                    </div>
                  </Surface>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div>

      {/* User Notes Modal */}
      {summaryId && result?.title && (
        <UserNotesModal
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          summaryId={summaryId}
          summaryTitle={result.title}
        />
      )}
    </section>
  );
}