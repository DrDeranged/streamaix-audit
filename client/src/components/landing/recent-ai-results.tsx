import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  Database,
  ExternalLink,
  Zap,
  Brain,
  Target,
  ArrowRight,
  Sparkles,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Summary {
  id: string;
  title: string;
  description: string;
  originalUrl: string;
  originalDuration: number;
  contentType: 'video' | 'podcast' | 'stream';
  platform: string;
  transcript: string;
  summary: string;
  tldrSummary: string;
  blogPost: string;
  marketAnalysis: string;
  rawData: any;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  accuracy: number;
  createdAt: string;
}

export function RecentAIResults() {
  const [activeTab, setActiveTab] = useState('tldr');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Fetch recent completed summaries
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['/api/summaries'],
    enabled: true,
  }) as { data: Summary[], isLoading: boolean };

  const completedSummaries = summaries
    .filter(s => s.processingStatus === 'completed' && s.tldrSummary)
    .slice(0, 3);

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="h-6 w-6 text-purple-400" />
            </motion.div>
            <span className="text-white text-lg">Loading AI Results...</span>
          </div>
        </div>
      </section>
    );
  }

  if (completedSummaries.length === 0) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50">
        <div className="container mx-auto max-w-7xl text-center">
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
            <Brain className="h-3 w-3 mr-1" />
            AI Content Analysis
          </Badge>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
            See AI Content Intelligence in Action
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-8">
            Process your first video or podcast above to see how our AI transforms content into actionable insights with TLDR summaries, comprehensive analysis, and market intelligence.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            onClick={() => {
              document.querySelector('#ai-analysis')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Try AI Processing Now
          </Button>
        </div>
      </section>
    );
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'tldr': return <Target className="h-4 w-4" />;
      case 'blog': return <BookOpen className="h-4 w-4" />;
      case 'market': return <TrendingUp className="h-4 w-4" />;
      case 'raw': return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
            <Brain className="h-3 w-3 mr-1" />
            Live AI Processing Results
          </Badge>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
            Real Content Intelligence in Action
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            See how our AI transforms long-form content into actionable insights. 
            Each result showcases different content formats optimized for maximum value extraction.
          </p>
        </motion.div>

        {/* Content Results Grid */}
        <div className="grid gap-8 lg:grid-cols-1 max-w-6xl mx-auto">
          <AnimatePresence>
            {completedSummaries.map((summary, index) => (
              <motion.div
                key={summary.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setHoveredCard(summary.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="group"
              >
                <Card className={`
                  bg-white/5 border-white/10 backdrop-blur-lg overflow-hidden transition-all duration-500
                  ${hoveredCard === summary.id ? 'bg-white/10 border-purple-500/30 shadow-2xl shadow-purple-500/20' : ''}
                  ${expandedCard === summary.id ? 'bg-white/10 border-purple-500/50' : ''}
                `}>
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <motion.div
                              animate={{ scale: hoveredCard === summary.id ? 1.1 : 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-500/30">
                                <Zap className="h-3 w-3 mr-1" />
                                {summary.accuracy}% Accuracy
                              </Badge>
                            </motion.div>
                            <Badge variant="outline" className="border-purple-500/30 text-purple-200">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {summary.platform}
                            </Badge>
                            <Badge variant="outline" className="border-blue-500/30 text-blue-200">
                              <Eye className="h-3 w-3 mr-1" />
                              AI Processed
                            </Badge>
                          </div>
                          <motion.h3 
                            className="text-2xl font-bold text-white mb-3 group-hover:bg-gradient-to-r group-hover:from-purple-200 group-hover:to-blue-200 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                          >
                            {summary.title}
                          </motion.h3>
                          {summary.description && (
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {summary.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-6">
                          <div className="text-right text-sm text-gray-400 space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {summary.originalDuration ? 
                                `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 
                                'N/A'
                              }
                            </div>
                            <div className="text-xs">
                              {new Date(summary.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-white/20 text-white hover:bg-white/10 hover:border-purple-400"
                              asChild
                            >
                              <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Source
                              </a>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                              onClick={() => setExpandedCard(
                                expandedCard === summary.id ? null : summary.id
                              )}
                            >
                              {expandedCard === summary.id ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Collapse
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Expand
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Tabs */}
                    <AnimatePresence>
                      {(expandedCard === summary.id || !expandedCard) && (
                        <motion.div 
                          className="p-6"
                          initial={{ height: expandedCard === summary.id ? 0 : "auto" }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-sm border border-white/10">
                              <TabsTrigger 
                                value="tldr" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:text-white transition-all duration-300"
                              >
                                {getContentIcon('tldr')}
                                <span className="hidden sm:inline">TLDR</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="blog" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:text-white transition-all duration-300"
                              >
                                {getContentIcon('blog')}
                                <span className="hidden sm:inline">Analysis</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="market" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:text-white transition-all duration-300"
                              >
                                {getContentIcon('market')}
                                <span className="hidden sm:inline">Market Intel</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="raw" 
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:text-white transition-all duration-300"
                              >
                                {getContentIcon('raw')}
                                <span className="hidden sm:inline">Metadata</span>
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="tldr" className="mt-6">
                              <motion.div 
                                className="space-y-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                              >
                                <div className="flex items-center gap-3 text-purple-300">
                                  <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                  >
                                    <Target className="h-5 w-5" />
                                  </motion.div>
                                  <span className="font-semibold text-lg">Key Takeaways</span>
                                  <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent flex-1" />
                                </div>
                                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-purple-500/20">
                                  <p className="text-gray-200 leading-relaxed text-lg">
                                    {summary.tldrSummary}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Sparkles className="h-3 w-3" />
                                  <span>AI-generated summary • Optimized for quick understanding</span>
                                </div>
                              </motion.div>
                            </TabsContent>

                            <TabsContent value="blog" className="mt-6">
                              <motion.div 
                                className="space-y-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                              >
                                <div className="flex items-center gap-3 text-blue-300">
                                  <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                  >
                                    <BookOpen className="h-5 w-5" />
                                  </motion.div>
                                  <span className="font-semibold text-lg">Comprehensive Analysis</span>
                                  <div className="h-px bg-gradient-to-r from-blue-500/50 to-transparent flex-1" />
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20 max-h-96 overflow-y-auto">
                                  <div className="text-gray-200 leading-relaxed prose prose-invert max-w-none">
                                    <div 
                                      dangerouslySetInnerHTML={{
                                        __html: summary.blogPost
                                          ?.replace(/# (.*)/g, '<h3 class="text-xl font-bold text-white mt-6 mb-3 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">$1</h3>')
                                          ?.replace(/## (.*)/g, '<h4 class="text-lg font-semibold text-blue-200 mt-4 mb-2">$1</h4>')
                                          ?.replace(/- \*\*(.*?)\*\*: (.*)/g, '<li class="mb-2"><strong class="text-blue-300">$1:</strong> <span class="text-gray-200">$2</span></li>')
                                          ?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                          ?.replace(/\n\n/g, '<br><br>')
                                          ?.replace(/\n/g, '<br>')
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Brain className="h-3 w-3" />
                                  <span>AI-powered deep analysis • Structured insights</span>
                                </div>
                              </motion.div>
                            </TabsContent>

                            <TabsContent value="market" className="mt-6">
                              <motion.div 
                                className="space-y-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                              >
                                <div className="flex items-center gap-3 text-green-300">
                                  <motion.div
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                  >
                                    <TrendingUp className="h-5 w-5" />
                                  </motion.div>
                                  <span className="font-semibold text-lg">Investment Intelligence</span>
                                  <div className="h-px bg-gradient-to-r from-green-500/50 to-transparent flex-1" />
                                </div>
                                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 border border-green-500/20">
                                  <p className="text-gray-200 leading-relaxed text-lg">
                                    {summary.marketAnalysis}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>Market intelligence • Investment insights</span>
                                </div>
                              </motion.div>
                            </TabsContent>

                            <TabsContent value="raw" className="mt-6">
                              <motion.div 
                                className="space-y-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                              >
                                <div className="flex items-center gap-3 text-orange-300">
                                  <motion.div
                                    animate={{ rotate: [0, 90, 180, 270, 360] }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                  >
                                    <Database className="h-5 w-5" />
                                  </motion.div>
                                  <span className="font-semibold text-lg">Processing Metadata</span>
                                  <div className="h-px bg-gradient-to-r from-orange-500/50 to-transparent flex-1" />
                                </div>
                                <div className="bg-black/30 rounded-xl p-4 border border-orange-500/20 max-h-64 overflow-y-auto">
                                  <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                                    {JSON.stringify(summary.rawData, null, 2)}
                                  </pre>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Database className="h-3 w-3" />
                                  <span>Technical metadata • Processing details</span>
                                </div>
                              </motion.div>
                            </TabsContent>
                          </Tabs>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Enhanced CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-8 border border-purple-500/20 backdrop-blur-sm">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4"
            >
              <Sparkles className="h-12 w-12 text-purple-400 mx-auto" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Ready to Transform Your Content?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join thousands who are extracting maximum value from podcasts, videos, and livestreams in minimum time
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-8"
                onClick={() => {
                  document.querySelector('#ai-analysis')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                Try AI Processing Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Results in 60 seconds</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}