import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Target
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

  // Fetch recent completed summaries
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['/api/summaries'],
    enabled: true,
  }) as { data: Summary[], isLoading: boolean };

  const completedSummaries = summaries
    .filter(s => s.processingStatus === 'completed' && s.tldrSummary)
    .slice(0, 3);

  if (isLoading || completedSummaries.length === 0) {
    return null;
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
        <div className="grid gap-8 lg:grid-cols-1 max-w-5xl mx-auto">
          {completedSummaries.map((summary, index) => (
            <motion.div
              key={summary.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-500/30">
                            <Zap className="h-3 w-3 mr-1" />
                            {summary.accuracy}% Accuracy
                          </Badge>
                          <Badge variant="outline" className="border-purple-500/30 text-purple-200">
                            {summary.platform}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {summary.title}
                        </h3>
                        {summary.description && (
                          <p className="text-gray-300 text-sm">
                            {summary.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="text-right text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {summary.originalDuration ? 
                              `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 
                              'N/A'
                            }
                          </div>
                          <div className="text-xs mt-1">
                            {new Date(summary.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-white/20 text-white hover:bg-white/10"
                          asChild
                        >
                          <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Source
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Content Tabs */}
                  <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 bg-white/5">
                        <TabsTrigger 
                          value="tldr" 
                          className="flex items-center gap-1 data-[state=active]:bg-purple-500/20"
                        >
                          {getContentIcon('tldr')}
                          TLDR
                        </TabsTrigger>
                        <TabsTrigger 
                          value="blog" 
                          className="flex items-center gap-1 data-[state=active]:bg-purple-500/20"
                        >
                          {getContentIcon('blog')}
                          Analysis
                        </TabsTrigger>
                        <TabsTrigger 
                          value="market" 
                          className="flex items-center gap-1 data-[state=active]:bg-purple-500/20"
                        >
                          {getContentIcon('market')}
                          Market Intel
                        </TabsTrigger>
                        <TabsTrigger 
                          value="raw" 
                          className="flex items-center gap-1 data-[state=active]:bg-purple-500/20"
                        >
                          {getContentIcon('raw')}
                          Metadata
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="tldr" className="mt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-purple-300">
                            <Target className="h-4 w-4" />
                            <span className="font-medium">Key Takeaways</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            {summary.tldrSummary}
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="blog" className="mt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-blue-300">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium">Comprehensive Analysis</span>
                          </div>
                          <div className="text-gray-300 leading-relaxed prose prose-invert max-w-none">
                            <div 
                              dangerouslySetInnerHTML={{
                                __html: summary.blogPost
                                  ?.replace(/# (.*)/g, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
                                  ?.replace(/## (.*)/g, '<h4 class="font-medium text-purple-200 mt-3 mb-1">$1</h4>')
                                  ?.replace(/- \*\*(.*?)\*\*: (.*)/g, '<li><strong class="text-blue-200">$1:</strong> $2</li>')
                                  ?.replace(/\n/g, '<br>')
                              }}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="market" className="mt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-300">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">Investment Intelligence</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            {summary.marketAnalysis}
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="raw" className="mt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-orange-300">
                            <Database className="h-4 w-4" />
                            <span className="font-medium">Processing Metadata</span>
                          </div>
                          <div className="bg-black/20 rounded-lg p-4 font-mono text-sm text-gray-300">
                            <pre>{JSON.stringify(summary.rawData, null, 2)}</pre>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">
            Experience the power of AI content intelligence for yourself
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            onClick={() => {
              document.querySelector('#ai-demo')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Try AI Processing Now
          </Button>
        </motion.div>
      </div>
    </section>
  );
}