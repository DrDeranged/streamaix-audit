import { useState } from 'react';
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
  Target,
  Shield
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
    impact: 'bullish' | 'bearish' | 'neutral';
    reasoning: string;
    priceTarget?: string;
    timeframe?: string;
    riskLevel?: string;
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
  const { toast } = useToast();

  // Query for processing result with real-time updates
  const { data: result, isLoading: isResultLoading, error } = useQuery<ProcessingResult>({
    queryKey: ['/api/processing-result', summaryId],
    enabled: !!summaryId,
    refetchInterval: (query) => {
      return query.state.data?.processingStatus === 'processing' ? 2000 : false;
    },
  });

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
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 1000);

      // Update status messages
      setTimeout(() => setProcessingStatus('Extracting video metadata...'), 1000);
      setTimeout(() => setProcessingStatus('Analyzing content with AI...'), 3000);
      setTimeout(() => setProcessingStatus('Generating insights...'), 6000);
      setTimeout(() => setProcessingStatus('Finalizing results...'), 8000);

      // Clean up progress after result comes in
      setTimeout(() => {
        clearInterval(progressInterval);
        setIsProcessing(false);
      }, 10000);

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

                            {result.financialTrends && result.financialTrends.length > 0 && (
                              <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                                <h5 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4" />
                                  Alpha-Generating Opportunities
                                </h5>
                                <div className="space-y-4">
                                  {result.financialTrends.map((financial: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-background/50 rounded-lg border border-cyan-500/20">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs font-semibold">
                                            {financial.category}
                                          </Badge>
                                          <span className="font-mono text-lg font-bold text-cyan-400">
                                            ${financial.symbol}
                                          </span>
                                          <span className="text-sm font-medium">{financial.company}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className={`text-xs font-semibold ${
                                            financial.impact === 'bullish' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                                            financial.impact === 'bearish' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                            'text-gray-400 border-gray-500/30 bg-gray-500/10'
                                          }`}>
                                            {financial.impact}
                                          </Badge>
                                          {financial.riskLevel && (
                                            <Badge variant="outline" className={`text-xs ${
                                              financial.riskLevel === 'Low' ? 'text-green-400 border-green-500/30' :
                                              financial.riskLevel === 'Medium' ? 'text-yellow-400 border-yellow-500/30' :
                                              'text-red-400 border-red-500/30'
                                            }`}>
                                              {financial.riskLevel} Risk
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3 mb-3">
                                        {financial.priceTarget && (
                                          <div className="p-2 bg-green-500/10 rounded-md border border-green-500/20">
                                            <div className="text-xs text-green-400 font-semibold mb-1">Price Target</div>
                                            <div className="text-sm font-mono font-bold text-green-300">{financial.priceTarget}</div>
                                          </div>
                                        )}
                                        {financial.timeframe && (
                                          <div className="p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                                            <div className="text-xs text-blue-400 font-semibold mb-1">Timeframe</div>
                                            <div className="text-sm font-bold text-blue-300">{financial.timeframe}</div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <p className="text-xs text-muted-foreground mb-2 italic">{financial.relevance}</p>
                                      <p className="text-sm text-foreground leading-relaxed">{financial.reasoning}</p>
                                      
                                      {financial.catalysts && financial.catalysts.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-muted-foreground/20">
                                          <div className="text-xs text-muted-foreground mb-1">Key Catalysts:</div>
                                          <div className="flex flex-wrap gap-1">
                                            {financial.catalysts.map((catalyst: string, catIdx: number) => (
                                              <Badge key={catIdx} variant="outline" className="text-xs">
                                                {catalyst}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
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
                            
                            {(result as any).sectorAnalysis && (
                              <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                                <h5 className="font-semibold mb-3 text-indigo-400 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Sector Rotation Analysis
                                </h5>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <div className="text-xs text-green-400 font-semibold mb-2">Bullish Sectors</div>
                                    <div className="space-y-1">
                                      {(result as any).sectorAnalysis.bullishSectors?.map((sector: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-xs text-green-400 border-green-500/30 mr-1">
                                          {sector}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-red-400 font-semibold mb-2">Bearish Sectors</div>
                                    <div className="space-y-1">
                                      {(result as any).sectorAnalysis.bearishSectors?.map((sector: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-xs text-red-400 border-red-500/30 mr-1">
                                          {sector}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  <span className="font-semibold">Rotation Signal:</span> {(result as any).sectorAnalysis.rotationSignals}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-semibold">Market Timing:</span> {(result as any).sectorAnalysis.marketTiming}
                                </div>
                              </div>
                            )}
                            
                            {(result as any).riskAssessment && (
                              <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                                <h5 className="font-semibold mb-3 text-orange-400 flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  Risk Assessment & Strategy
                                </h5>
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                  <div className="text-center p-2 bg-background/50 rounded-md">
                                    <div className="text-xs text-muted-foreground mb-1">Market Risk</div>
                                    <div className="text-sm font-semibold">{(result as any).riskAssessment.marketRisk}</div>
                                  </div>
                                  <div className="text-center p-2 bg-background/50 rounded-md">
                                    <div className="text-xs text-muted-foreground mb-1">Volatility</div>
                                    <div className="text-sm font-semibold">{(result as any).riskAssessment.volatilityOutlook}</div>
                                  </div>
                                  <div className="text-center p-2 bg-background/50 rounded-md">
                                    <div className="text-xs text-muted-foreground mb-1">Hedging</div>
                                    <div className="text-sm font-semibold">Active</div>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  <span className="font-semibold">Key Risks:</span> {(result as any).riskAssessment.keyRisks?.join(', ')}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-semibold">Strategy:</span> {(result as any).riskAssessment.hedgingStrategy}
                                </div>
                              </div>
                            )}
                            
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h5 className="font-semibold mb-2">Alpha Generation Summary</h5>
                              <p className="text-sm text-muted-foreground">
                                This analysis provides {result.marketSentiment.toLowerCase()} market signals with {result.sourceCredibility.toLowerCase()} source credibility. 
                                The identified opportunities offer asymmetric risk/reward profiles suitable for sophisticated investors seeking alpha generation through 
                                precise market timing and sector rotation strategies.
                              </p>
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