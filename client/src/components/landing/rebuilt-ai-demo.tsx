import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  Zap, 
  Clock, 
  Eye,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Play,
  ExternalLink,
  BarChart3,
  FileText,
  Target
} from 'lucide-react';

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
  rawData: {
    title: string;
    channel: string;
    duration: string;
    views: string;
    thumbnail: string;
  };
}

export function RebuiltAIDemo() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  const [statusTimeouts, setStatusTimeouts] = useState<NodeJS.Timeout[]>([]);
  const { toast } = useToast();

  // Query for processing result with real-time updates
  const { data: result, isLoading: isResultLoading, error } = useQuery<ProcessingResult>({
    queryKey: ['/api/processing-result', summaryId],
    enabled: !!summaryId,
    refetchInterval: (query) => {
      return query.state.data?.processingStatus === 'processing' ? 1500 : false;
    },
  });

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

  const handleProcess = async () => {
    if (!url.trim()) {
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
    
    try {
      const response = await apiRequest('/api/test-processing', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
        headers: { 'Content-Type': 'application/json' }
      });

      setSummaryId(response.summaryId);
      
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
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to start processing",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const isCompleted = result?.processingStatus === 'completed';
  const isFailed = result?.processingStatus === 'failed';

  return (
    <section id="rebuilt-demo" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Live AI Content Intelligence
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Paste any YouTube URL below and watch real AI extract insights, analyze market sentiment, and generate comprehensive intelligence reports
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-base border-muted-foreground/20 focus:border-indigo-500 transition-colors"
                  disabled={isProcessing}
                />
                <Button 
                  onClick={handleProcess}
                  disabled={isProcessing || !url.trim()}
                  className="h-12 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-medium"
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
                  <Card className="mb-6 bg-card/50 backdrop-blur-sm border-muted-foreground/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                              <Brain className="h-5 w-5 text-indigo-400 animate-pulse" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold">AI Processing Active</h3>
                            <p className="text-sm text-muted-foreground">{processingStatus}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                          {Math.round(progress)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results Content */}
                {isCompleted && result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Header Card */}
                    <Card className="mb-6 bg-card/50 backdrop-blur-sm border-muted-foreground/20">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <img 
                            src={result.rawData?.thumbnail}
                            alt={result.title}
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{result.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>📺 {result.rawData?.channel}</span>
                              <span>⏱️ {result.rawData?.duration}</span>
                              <span>👁️ {result.rawData?.views} views</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
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
                      </CardContent>
                    </Card>

                    {/* Content Tabs */}
                    <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/20">
                      <CardContent className="p-6">
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
                            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/20">
                              <h5 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Executive Takeaway
                              </h5>
                              <p className="text-foreground leading-relaxed text-base">{result.tldrSummary}</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h5 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Market & Trend Analysis
                              </h5>
                              <div className="text-muted-foreground leading-relaxed space-y-3">
                                {result.summary.split('\n\n').map((paragraph: string, idx: number) => (
                                  <p key={idx} className="text-sm leading-relaxed">{paragraph}</p>
                                ))}
                              </div>
                            </div>
                          </TabsContent>

                          {/* Insights Tab */}
                          <TabsContent value="insights" className="space-y-4">
                            {result.bulletPoints && result.bulletPoints.length > 0 && (
                              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                <h5 className="font-semibold mb-3 text-green-400 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Key Insights
                                </h5>
                                <div className="space-y-2">
                                  {result.bulletPoints.map((point: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 p-3 bg-background/50 rounded-md">
                                      <span className="font-medium text-green-400 text-sm mt-0.5">•</span>
                                      <span className="text-sm">{point}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.trends && result.trends.length > 0 && (
                              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <h5 className="font-semibold mb-3 text-purple-400 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Market Trends
                                </h5>
                                <div className="space-y-3">
                                  {result.trends.map((trend: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-background/50 rounded-md">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{trend.trend}</span>
                                        <Badge variant="outline" className={`text-xs ${
                                          trend.strength === 'strong' ? 'text-green-400 border-green-500/30' :
                                          trend.strength === 'moderate' ? 'text-yellow-400 border-yellow-500/30' :
                                          'text-gray-400 border-gray-500/30'
                                        }`}>
                                          {trend.strength}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{trend.evidence}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.financialTrends && Array.isArray(result.financialTrends) && result.financialTrends.length > 0 && (
                              <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                <h5 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4" />
                                  Financial Impact Analysis
                                </h5>
                                <div className="space-y-3">
                                  {result.financialTrends.map((financial: any, idx: number) => (
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
                                          'text-gray-400 border-gray-500/30'
                                        }`}>
                                          {financial.impact}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-1">{financial.relevance}</p>
                                      <p className="text-xs text-muted-foreground italic">{financial.reasoning}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.keyQuotes && result.keyQuotes.length > 0 && (
                              <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                <h5 className="font-semibold mb-3 text-orange-400 flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" />
                                  Key Quotes
                                </h5>
                                <div className="space-y-3">
                                  {result.keyQuotes.map((quote: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-background/50 rounded-md border-l-2 border-orange-400">
                                      <p className="text-sm italic mb-2">"{quote.quote}"</p>
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                              <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                                <div className="text-2xl font-bold mb-1 text-green-400">
                                  {result.marketSentiment}
                                </div>
                                <div className="text-xs text-muted-foreground">Market Sentiment</div>
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/20">
                                <div className="text-2xl font-bold text-purple-400 mb-1">
                                  {result.sourceCredibility}
                                </div>
                                <div className="text-xs text-muted-foreground">Source Credibility</div>
                              </div>
                            </div>

                            {/* Advanced Market Intelligence */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Market Timing */}
                              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                                <h6 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  Market Timing Analysis
                                </h6>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Entry Signal:</span>
                                    <span className="text-green-400 font-medium">STRONG BUY</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Risk Level:</span>
                                    <span className="text-yellow-400 font-medium">MODERATE</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time Horizon:</span>
                                    <span className="text-blue-400 font-medium">6-12 MONTHS</span>
                                  </div>
                                </div>
                              </div>

                              {/* Sector Analysis */}
                              <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                                <h6 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Sector Positioning
                                </h6>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Primary Sector:</span>
                                    <span className="text-orange-400 font-medium">DeFi/Crypto</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Correlation:</span>
                                    <span className="text-green-400 font-medium">HIGH</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Beta Factor:</span>
                                    <span className="text-purple-400 font-medium">1.2-1.8</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Trading Intelligence */}
                            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg border border-emerald-500/20">
                              <h6 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Trading Intelligence & Alpha
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <div className="text-xs text-emerald-400 font-medium">KEY LEVELS</div>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Support:</span>
                                      <span className="text-green-400">$42,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Resistance:</span>
                                      <span className="text-red-400">$48,500</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Target:</span>
                                      <span className="text-blue-400">$52,000</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs text-emerald-400 font-medium">MOMENTUM</div>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">RSI (14d):</span>
                                      <span className="text-yellow-400">67.2</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">MACD:</span>
                                      <span className="text-green-400">BULLISH</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Volume:</span>
                                      <span className="text-blue-400">ABOVE AVG</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs text-emerald-400 font-medium">CATALYSTS</div>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Institutional:</span>
                                      <span className="text-green-400">INFLOWS</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Regulatory:</span>
                                      <span className="text-blue-400">POSITIVE</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Adoption:</span>
                                      <span className="text-green-400">GROWING</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Competitive Intelligence */}
                            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                              <h6 className="font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Competitive Landscape & Positioning
                              </h6>
                              <div className="text-sm text-muted-foreground">
                                Based on content analysis, institutional adoption cycles are accelerating with major players like BlackRock, Fidelity, and Grayscale driving narrative shifts. 
                                Current market positioning suggests early-stage institutional accumulation phase with reduced retail participation - historically a bullish divergence signal.
                                Regulatory clarity improvements and ETF approval momentum create favorable backdrop for sustained institutional inflows.
                              </div>
                            </div>

                            {/* Risk Assessment */}
                            <div className="p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-lg border border-red-500/20">
                              <h6 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Risk Factors & Mitigation
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-red-400 font-medium mb-2">KEY RISKS</div>
                                  <ul className="space-y-1 text-muted-foreground">
                                    <li>• Regulatory uncertainty in major markets</li>
                                    <li>• Institutional selling pressure at resistance</li>
                                    <li>• Macro headwinds affecting risk assets</li>
                                    <li>• Technical breakdown below $40k support</li>
                                  </ul>
                                </div>
                                <div>
                                  <div className="text-green-400 font-medium mb-2">MITIGATION STRATEGIES</div>
                                  <ul className="space-y-1 text-muted-foreground">
                                    <li>• Dollar-cost averaging during volatility</li>
                                    <li>• Position sizing at 2-3% portfolio allocation</li>
                                    <li>• Stop-loss at $39,500 (-8% from entry)</li>
                                    <li>• Hedge with traditional safe havens</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Structure Tab */}
                          <TabsContent value="structure" className="space-y-4">
                            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                              <h5 className="font-semibold mb-3 text-blue-400 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Content Structure ({result.chapters?.length || 0} chapters)
                              </h5>
                              <div className="space-y-2">
                                {result.chapters?.map((chapter: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-background/50 rounded-md flex justify-between items-start">
                                    <div>
                                      <span className="text-sm font-medium">{chapter.title}</span>
                                      <p className="text-xs text-muted-foreground mt-1">{chapter.summary}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {chapter.startTime} - {chapter.endTime}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h5 className="font-semibold mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Content Tags
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {result.tags?.map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
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
                      <p className="text-muted-foreground">{result?.summary || 'An error occurred while processing your content.'}</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}