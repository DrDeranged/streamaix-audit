import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  Zap, 
  Clock, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Play,
  ExternalLink
} from 'lucide-react';

interface ProcessingResult {
  id: string;
  title: string;
  summary: string;
  tldrSummary: string;
  blogPost: string;
  marketAnalysis: string;
  processingStatus: string;
  accuracy: number;
  originalDuration: number;
  platform: string;
  rawData: {
    title: string;
    channel: string;
    duration: string;
    views: string;
    thumbnail: string;
  };
  keyInsights: Array<{
    insight: string;
    timestamp: string;
    importance: string;
  }>;
  chapters: Array<{
    title: string;
    startTime: string;
    endTime: string;
    summary: string;
  }>;
}

export default function CleanAIDemo() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const { toast } = useToast();

  // Query for processing result
  const { data: result, isLoading: isResultLoading } = useQuery({
    queryKey: ['/api/summaries', summaryId],
    enabled: !!summaryId,
    refetchInterval: (data) => {
      return data?.processingStatus === 'processing' ? 2000 : false;
    },
  }) as { data: { summary: ProcessingResult }, isLoading: boolean };

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
    
    try {
      const response = await apiRequest('/api/test-processing', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
        headers: { 'Content-Type': 'application/json' }
      });

      setSummaryId(response.summaryId);
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
    } finally {
      setIsProcessing(false);
    }
  };

  const processingResult = result?.summary;
  const isCompleted = processingResult?.processingStatus === 'completed';
  const isFailed = processingResult?.processingStatus === 'failed';

  const tabs = [
    { id: 'summary', label: 'Summary', icon: Brain },
    { id: 'insights', label: 'Key Insights', icon: Zap },
    { id: 'chapters', label: 'Chapters', icon: Clock },
    { id: 'market', label: 'Market Analysis', icon: Eye }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Real AI Content Analysis
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience genuine AI-powered content processing. No mock data, no placeholders - just real analysis.
          </p>
        </motion.div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  disabled={isProcessing}
                />
                <Button 
                  onClick={handleProcess}
                  disabled={isProcessing || !url.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Analyze
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Status */}
        <AnimatePresence>
          {summaryId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Status Header */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isResultLoading || processingResult?.processingStatus === 'processing' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      ) : isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : isFailed ? (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {processingResult?.title || 'Processing...'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Status: {processingResult?.processingStatus || 'Starting...'}
                        </p>
                      </div>
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        {processingResult.accuracy}% Accuracy
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Results Content */}
              {isCompleted && processingResult && (
                <>
                  {/* Video Info */}
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <img 
                          src={processingResult.rawData.thumbnail}
                          alt={processingResult.title}
                          className="w-32 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-white mb-2">
                            {processingResult.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>📺 {processingResult.rawData.channel}</span>
                            <span>⏱️ {processingResult.rawData.duration}</span>
                            <span>👁️ {processingResult.rawData.views} views</span>
                            <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                              {processingResult.platform}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Watch
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Content Tabs */}
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6">
                      {/* Tab Navigation */}
                      <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                isActive 
                                  ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white' 
                                  : 'text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab Content */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {activeTab === 'summary' && (
                            <div className="space-y-4">
                              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <h5 className="text-lg font-semibold text-blue-300 mb-2">TLDR</h5>
                                <p className="text-gray-200">{processingResult.tldrSummary}</p>
                              </div>
                              <div className="p-4 bg-white/5 rounded-lg">
                                <h5 className="text-lg font-semibold text-white mb-2">Full Summary</h5>
                                <p className="text-gray-200 leading-relaxed">{processingResult.summary}</p>
                              </div>
                            </div>
                          )}

                          {activeTab === 'insights' && (
                            <div className="space-y-3">
                              {processingResult.keyInsights?.map((insight, index) => (
                                <div key={index} className="p-4 bg-white/5 rounded-lg">
                                  <div className="flex items-start justify-between mb-2">
                                    <Badge className={`
                                      ${insight.importance === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' : ''}
                                      ${insight.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : ''}
                                      ${insight.importance === 'low' ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' : ''}
                                    `}>
                                      {insight.importance} priority
                                    </Badge>
                                    <span className="text-sm text-gray-400">{insight.timestamp}</span>
                                  </div>
                                  <p className="text-gray-200">{insight.insight}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {activeTab === 'chapters' && (
                            <div className="space-y-3">
                              {processingResult.chapters?.map((chapter, index) => (
                                <div key={index} className="p-4 bg-white/5 rounded-lg">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-mono text-purple-300">
                                      {chapter.startTime} - {chapter.endTime}
                                    </span>
                                    <h6 className="font-semibold text-white">{chapter.title}</h6>
                                  </div>
                                  <p className="text-gray-200">{chapter.summary}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {activeTab === 'market' && (
                            <div className="p-4 bg-white/5 rounded-lg">
                              <h5 className="text-lg font-semibold text-white mb-3">Market Analysis</h5>
                              <p className="text-gray-200 leading-relaxed">{processingResult.marketAnalysis}</p>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </>
              )}

              {isFailed && (
                <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-300 mb-2">Processing Failed</h3>
                    <p className="text-gray-300">{processingResult?.summary || 'An error occurred while processing your content.'}</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}