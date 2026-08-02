import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
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
  suggestedMarkets?: Array<{
    question: string;
    description: string;
    category: string;
    deadline: string;
    confidence: number;
    resolutionSource?: string;
    tags?: string[];
  }>;
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
        <section className="py-20 px-4 bg-ink-page">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="h-6 w-6 text-accent-bright" />
            </motion.div>
            <span className="text-primary text-lg">Loading AI Results...</span>
          </div>
        </div>
      </section>
    );
  }

  if (completedSummaries.length === 0) {
    return (
        <section className="py-20 px-4 bg-ink-page">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="mb-8 flex flex-col items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-bright">AI Content Analysis</span>
            <SectionTitle className="text-center">AI Content Intelligence</SectionTitle>
            <p className="text-body">Process your first video or podcast to see AI in action</p>
          </div>
          <Button 
            size="lg" 
            className="grad-accent glow-accent text-primary border-0 rounded-xl"
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
    <section className="py-20 px-4 bg-ink-page">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-bright">Live AI Processing</span>
            <SectionTitle className="text-center">Content Intelligence in Action</SectionTitle>
            <p className="text-body">See how our AI transforms long-form content into actionable insights</p>
          </div>
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
                <Surface className={`
                  overflow-hidden transition-all duration-500
                  ${hoveredCard === summary.id ? 'bg-ink-raised border-accent-core/30' : ''}
                  ${expandedCard === summary.id ? 'bg-ink-raised border-accent-core/50' : ''}
                `}>
                  <div className="p-0">
                    {/* Header */}
                    <div className="p-6 border-b border-ink-divider">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <motion.div
                              animate={{ scale: hoveredCard === summary.id ? 1.1 : 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Badge variant="secondary" className="bg-gain/10 text-gain border-gain/30">
                                <Zap className="h-3 w-3 mr-1" />
                                {summary.accuracy}% Accuracy
                              </Badge>
                            </motion.div>
                            <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {summary.platform}
                            </Badge>
                            <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
                              <Eye className="h-3 w-3 mr-1" />
                              AI Processed
                            </Badge>
                          </div>
                          <motion.h3 
                            className="text-2xl font-bold text-primary mb-3 transition-all duration-300"
                          >
                            {summary.title}
                          </motion.h3>
                          {summary.description && (
                            <p className="text-body text-sm leading-relaxed">
                              {summary.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-6">
                          <div className="text-right text-sm text-secondary space-y-1">
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
                              className="border-ink-edge text-primary hover:bg-ink-raised hover:border-accent-core rounded-xl"
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
                              className="text-accent-bright hover:text-primary hover:bg-accent-core/10 rounded-xl"
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
                            <TabsList className="grid w-full grid-cols-4 bg-ink-raised border border-ink-edge rounded-xl">
                              <TabsTrigger 
                                value="tldr" 
                                className="flex items-center gap-2 data-[state=active]:bg-accent-core data-[state=active]:text-primary transition-all duration-300 rounded-xl"
                              >
                                {getContentIcon('tldr')}
                                <span className="hidden sm:inline">TLDR</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="blog" 
                                className="flex items-center gap-2 data-[state=active]:bg-accent-core data-[state=active]:text-primary transition-all duration-300 rounded-xl"
                              >
                                {getContentIcon('blog')}
                                <span className="hidden sm:inline">Analysis</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="market" 
                                className="flex items-center gap-2 data-[state=active]:bg-accent-core data-[state=active]:text-primary transition-all duration-300 rounded-xl"
                              >
                                {getContentIcon('market')}
                                <span className="hidden sm:inline">Market Intel</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="raw" 
                                className="flex items-center gap-2 data-[state=active]:bg-accent-core data-[state=active]:text-primary transition-all duration-300 rounded-xl"
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
                                  <div className="flex items-center gap-3 text-accent-bright">
                                  <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                  >
                                    <Target className="h-5 w-5" />
                                  </motion.div>
                                  <span className="font-semibold text-lg">Key Takeaways</span>
                                  <div className="h-px bg-accent-core/50 flex-1" />
                                </div>
                                <Surface variant="raised" className="p-4 border border-accent-core/20">
                                  <p className="text-body leading-relaxed text-lg">
                                    {summary.tldrSummary}
                                  </p>
                                </Surface>
                                <div className="flex items-center gap-2 text-sm text-secondary">
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
                                <div className="flex items-center gap-3 text-accent-bright">
                                  <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                  >
                                    <BookOpen className="h-5 w-5" />
                                  </motion.div>
                                  <span className="font-semibold text-lg">Comprehensive Analysis</span>
                                  <div className="h-px bg-accent-core/50 flex-1" />
                                </div>
                                <Surface variant="raised" className="p-6 border border-accent-core/20 max-h-96 overflow-y-auto">
                                  <div className="text-body leading-relaxed prose prose-invert max-w-none">
                                    <div 
                                      dangerouslySetInnerHTML={{
                                        __html: summary.blogPost
                                          ?.replace(/# (.*)/g, '<h3 class="text-xl font-bold text-primary mt-6 mb-3">$1</h3>')
                                          ?.replace(/## (.*)/g, '<h4 class="text-lg font-semibold text-accent-bright mt-4 mb-2">$1</h4>')
                                          ?.replace(/- \*\*(.*?)\*\*: (.*)/g, '<li class="mb-2"><strong class="text-accent-bright">$1:</strong> <span class="text-body">$2</span></li>')
                                          ?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                                          ?.replace(/\n\n/g, '<br><br>')
                                          ?.replace(/\n/g, '<br>')
                                      }}
                                    />
                                  </div>
                                </Surface>
                                <div className="flex items-center gap-2 text-sm text-secondary">
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
                                <div className="flex items-center gap-3 text-gain">
                                  <motion.div
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                  >
                                    <TrendingUp className="h-5 w-5" />
                                  </motion.div>
                                  <span className="font-semibold text-lg">Investment Intelligence</span>
                                  <div className="h-px bg-gain/50 flex-1" />
                                </div>
                                <Surface variant="raised" className="p-4 border border-gain/20">
                                  <p className="text-body leading-relaxed text-lg">
                                    {summary.marketAnalysis}
                                  </p>
                                </Surface>
                                <div className="flex items-center gap-2 text-sm text-secondary">
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
                                <div className="flex items-center gap-3 text-warn">
                                  <motion.div
                                    animate={{ rotate: [0, 90, 180, 270, 360] }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                  >
                                    <Database className="h-5 w-5" />
                                  </motion.div>
                                  <span className="font-semibold text-lg">Processing Metadata</span>
                                  <div className="h-px bg-warn/50 flex-1" />
                                </div>
                                <Surface variant="raised" className="p-4 border border-warn/20 max-h-64 overflow-y-auto">
                                  <pre className="text-secondary text-sm font-mono whitespace-pre-wrap">
                                    {JSON.stringify(summary.rawData, null, 2)}
                                  </pre>
                                </Surface>
                                <div className="flex items-center gap-2 text-sm text-secondary">
                                  <Database className="h-3 w-3" />
                                  <span>Technical metadata • Processing details</span>
                                </div>
                              </motion.div>
                            </TabsContent>
                          </Tabs>

                          {/* AI-Generated Prediction Markets Preview */}
                          {summary.suggestedMarkets && summary.suggestedMarkets.length > 0 && (
                            <motion.div 
                              className="mt-8 pt-6 border-t border-ink-divider"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-accent-core/20 rounded-xl">
                                  <Sparkles className="h-5 w-5 text-accent-bright" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-primary">AI-Extracted Predictions</h4>
                                  <p className="text-sm text-secondary">
                                    {summary.suggestedMarkets.length} tradeable prediction{summary.suggestedMarkets.length > 1 ? 's' : ''} found in this content
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid gap-3 sm:grid-cols-2">
                                {summary.suggestedMarkets.map((market, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                    className="bg-ink-raised rounded-xl p-4 border border-accent-core/30 hover:border-accent-core/50 transition-all duration-300"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/30 text-xs">
                                        {market.category}
                                      </Badge>
                                      <Badge variant="outline" className="border-accent-core/30 text-accent-bright text-xs">
                                        {Math.round(market.confidence * 100)}% confidence
                                      </Badge>
                                    </div>
                                    <h5 className="text-primary font-semibold mb-2 leading-tight">
                                      {market.question}
                                    </h5>
                                    <p className="text-body text-sm mb-3 line-clamp-2">
                                      {market.description}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-secondary">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(market.deadline).toLocaleDateString()}
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        className="h-7 text-accent-bright hover:text-primary hover:bg-accent-core/20 rounded-xl"
                                        onClick={() => window.location.href = `/summary/${summary.id}`}
                                      >
                                        Create Market
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                      </Button>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                              
                              <div className="mt-4 text-center">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="border-accent-core/30 text-accent-bright hover:bg-accent-core/20 hover:border-accent-core/50 rounded-xl"
                                  onClick={() => window.location.href = `/summary/${summary.id}`}
                                >
                                  <Sparkles className="h-3 w-3 mr-2" />
                                  View Full Summary & Create Markets
                                  <ArrowRight className="h-3 w-3 ml-2" />
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Surface>
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
          <Surface className="p-8 border-accent-core/20">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4"
            >
              <Sparkles className="h-12 w-12 text-accent-bright mx-auto" />
            </motion.div>
            <h3 className="text-2xl font-bold text-primary mb-3">
              Ready to Transform Your Content?
            </h3>
            <p className="text-body mb-6 max-w-2xl mx-auto">
              Join thousands who are extracting maximum value from podcasts, videos, and livestreams in minimum time
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="grad-accent glow-accent text-primary border-0 px-8 rounded-xl"
                onClick={() => {
                  document.querySelector('#ai-analysis')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                Try AI Processing Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <div className="text-sm text-secondary flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Results in 60 seconds</span>
              </div>
            </div>
          </Surface>
        </motion.div>
      </div>
    </section>
  );
}