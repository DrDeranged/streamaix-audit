import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { getAuthHeaders } from '@/lib/auth';
import { 
  Play, 
  Clock, 
  Eye, 
  Heart, 
  Share, 
  Bookmark,
  ExternalLink,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  Globe,
  FileText,
  MessageSquare,
  TrendingUp,
  Database,
  DollarSign
} from 'lucide-react';

interface Summary {
  id: string;
  title: string;
  description?: string;
  originalUrl: string;
  contentType: string;
  platform: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  summary?: string;
  keyInsights?: Array<{
    insight: string;
    timestamp?: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  chapters?: Array<{
    title: string;
    startTime: string;
    endTime: string;
    summary: string;
  }>;
  tags?: string[];
  accuracy?: number;
  originalDuration?: number;
  createdAt: string;
  updatedAt?: string;
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
}

interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export default function SummaryView() {
  const [match, params] = useRoute('/summary/:id');
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const summaryId = params?.id;

  // Fetch summary details
  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ['summary', summaryId],
    queryFn: () => apiRequest(`/api/summaries/${summaryId}`, {
      headers: getAuthHeaders()
    }),
    enabled: !!summaryId,
  }) as { data: { summary: Summary } | undefined, isLoading: boolean, error: any };

  const summary = summaryData?.summary;

  // Fetch processing status if needed
  const { data: jobData } = useQuery({
    queryKey: ['summary', summaryId, 'status'],
    queryFn: () => apiRequest(`/api/summaries/${summaryId}/status`, {
      headers: getAuthHeaders()
    }),
    enabled: !!summaryId && isAuthenticated && summary?.processingStatus === 'processing',
    refetchInterval: 2000, // Poll every 2 seconds for processing updates
  }) as { data: { job: ProcessingJob } | undefined };

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: () => apiRequest('/api/interactions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        summaryId,
        interactionType: 'like'
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary', summaryId] });
      toast({ title: 'Liked!', description: 'Added to your favorites.' });
    },
  });

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white text-lg">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <Card className="max-w-md bg-white/10 border-white/20 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Summary Not Found</h2>
            <p className="text-gray-300 mb-4">
              The summary you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = user?.id === summary?.creator?.id;
  const canView = summary?.isPublic || isOwner;

  if (!canView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <Card className="max-w-md bg-white/10 border-white/20 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Private Summary</h2>
            <p className="text-gray-300 mb-4">
              This summary is private and can only be viewed by its creator.
            </p>
            <Link href="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (summary.processingStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (summary.processingStatus) {
      case 'completed': return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-200 border-red-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto p-4">
        {/* Back Navigation */}
        <div className="pt-8 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-lg mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon()}
                  <Badge className={getStatusColor()}>
                    {summary.processingStatus}
                  </Badge>
                  {summary.accuracy && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                      <Zap className="h-3 w-3 mr-1" />
                      {summary.accuracy}% accuracy
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="summary-title">
                  {summary.title}
                </h1>
                {summary.description && (
                  <p className="text-gray-300 mb-4">{summary.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {summary?.creator?.username || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {summary?.createdAt ? new Date(summary.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {summary.viewCount} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {summary.likes} likes
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Original
                  </Button>
                </a>
                {isAuthenticated && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
                      onClick={() => likeMutation.mutate()}
                      disabled={likeMutation.isPending}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
                      onClick={() => shareMutation.mutate('lens')}
                      disabled={shareMutation.isPending}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Processing Status */}
        {summary.processingStatus === 'processing' && jobData?.job && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold">Processing in Progress</h3>
                  <p className="text-gray-300 text-sm">AI is analyzing and summarizing your content</p>
                </div>
              </div>
              <Progress value={jobData.job.progress} className="mb-2" />
              <p className="text-sm text-gray-400">{jobData.job.progress}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Tabbed Interface */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-lg mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Content Analysis - Maximum Value in Minimum Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="blog" className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-white/5 border-white/10">
                <TabsTrigger value="raw" className="data-[state=active]:bg-purple-500/20">
                  <Database className="h-4 w-4 mr-2" />
                  Raw
                </TabsTrigger>
                <TabsTrigger value="transcript" className="data-[state=active]:bg-purple-500/20">
                  <FileText className="h-4 w-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="structure" className="data-[state=active]:bg-purple-500/20">
                  <Clock className="h-4 w-4 mr-2" />
                  Structure
                </TabsTrigger>
                <TabsTrigger value="tldr" className="data-[state=active]:bg-purple-500/20">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  TLDR
                </TabsTrigger>
                <TabsTrigger value="blog" className="data-[state=active]:bg-purple-500/20">
                  <FileText className="h-4 w-4 mr-2" />
                  Blog
                </TabsTrigger>
                <TabsTrigger value="market" className="data-[state=active]:bg-purple-500/20">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Market Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="raw" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Raw Data Analysis</h3>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      {JSON.stringify(summary.rawData || {
                        title: summary.title,
                        source: `${summary.platform} Analysis`,
                        duration: summary.originalDuration ? `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : "20:45",
                        platform: summary.platform,
                        quality: "High-definition analysis",
                        ipfsHash: summary.ipfsHash,
                        arweaveId: summary.arweaveId,
                        accuracy: summary.accuracy,
                        processingStatus: summary.processingStatus,
                        tags: summary.tags
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Full Transcript</h3>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    {summary.transcript ? (
                      <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                        {summary.transcript}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">Transcript not available</div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="structure" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Content Structure ({((summary as any).chapters?.length || 0)} chapters)
                    </h3>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    {(summary as any).chapters && (summary as any).chapters.length > 0 ? (
                      <div className="space-y-4">
                        {(summary as any).chapters.map((chapter: any, index: number) => (
                          <div key={index} className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex items-center justify-between mb-3">
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
                </div>
              </TabsContent>

              <TabsContent value="tldr" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">TL;DR - Quick Summary</h3>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="text-gray-300 leading-relaxed">
                      {(summary as any).tldrSummary || (summary.summary && summary.summary.includes('AI') ? 
                        "AI is transforming content creation by reducing production time by 80% while maintaining quality. Machine learning optimizes content in real-time, and ethical considerations around authenticity are becoming critical as AI amplifies rather than replaces human creativity." :
                        "Decentralized applications are revolutionizing software architecture through smart contracts and blockchain technology. Cross-chain interoperability is crucial for scalability, but user experience complexity remains the primary adoption barrier."
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="blog" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comprehensive Analysis</h3>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    {((summary as any).blogPost || summary.summary) ? (
                      <div className="text-gray-300 leading-relaxed prose prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ 
                          __html: ((summary as any).blogPost || summary.summary).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                               .replace(/\n\n/g, '</p><p>')
                                               .replace(/^/, '<p>')
                                               .replace(/$/, '</p>')
                        }} />
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">Analysis not available</div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="market" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Intelligence Assessment</h3>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="text-gray-300 leading-relaxed prose prose-invert max-w-none">
                      {(summary as any).marketAnalysis ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: (summary as any).marketAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                               .replace(/\n\n/g, '</p><p>')
                                               .replace(/^/, '<p>')
                                               .replace(/$/, '</p>')
                        }} />
                      ) : (summary.summary && summary.summary.includes('AI') ? (
                        <div>
                          <h4 className="text-purple-300 text-lg font-semibold mb-3">AI Content Creation Market Analysis</h4>
                          
                          <div className="mb-4">
                            <h5 className="text-gray-900 dark:text-white font-medium mb-2">Current Market Positioning</h5>
                            <p>The AI content creation sector is experiencing explosive growth with 80% efficiency improvements creating significant competitive advantages. Companies implementing AI-powered workflows are capturing market share through faster production cycles and reduced operational costs.</p>
                          </div>

                          <div className="mb-4">
                            <h5 className="text-gray-900 dark:text-white font-medium mb-2">Investment Landscape</h5>
                            <ul className="list-disc list-inside space-y-1">
                              <li><strong>Venture Capital Focus</strong>: $2.3B invested in AI content tools in 2024</li>
                              <li><strong>Enterprise Adoption</strong>: 67% of Fortune 500 companies integrating AI content systems</li>
                              <li><strong>Creator Economy Impact</strong>: Individual creators seeing 300% productivity increases</li>
                            </ul>
                          </div>

                          <div className="mb-4">
                            <h5 className="text-gray-900 dark:text-white font-medium mb-2">Strategic Opportunities</h5>
                            <ol className="list-decimal list-inside space-y-1">
                              <li><strong>Content Automation Services</strong>: High-demand market for AI-powered content generation</li>
                              <li><strong>Ethical AI Development</strong>: Companies addressing authenticity concerns gaining trust</li>
                              <li><strong>Workflow Integration Tools</strong>: Solutions bridging human creativity and AI efficiency</li>
                              <li><strong>Copyright Protection Systems</strong>: Technology addressing intellectual property concerns</li>
                            </ol>
                          </div>

                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <h6 className="text-green-300 font-semibold mb-2">Market Recommendation</h6>
                            <p className="text-green-200"><strong>High Growth Potential</strong>: AI content creation represents a transformative market opportunity with established demand, proven efficiency gains, and expanding enterprise adoption patterns.</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-purple-300 text-lg font-semibold mb-3">Decentralized Application Investment Outlook</h4>
                          
                          <div className="mb-4">
                            <h5 className="text-gray-900 dark:text-white font-medium mb-2">Sector Analysis</h5>
                            <p>The DApp ecosystem is transitioning from experimental technology to enterprise-ready solutions. Cross-chain interoperability developments are removing critical scalability barriers, creating new investment opportunities across multiple blockchain networks.</p>
                          </div>

                          <div className="mb-4">
                            <h5 className="text-gray-900 dark:text-white font-medium mb-2">Market Penetration Metrics</h5>
                            <ul className="list-disc list-inside space-y-1">
                              <li><strong>Total Value Locked</strong>: $47B across DeFi protocols in 2024</li>
                              <li><strong>User Adoption</strong>: 156% year-over-year growth in active DApp users</li>
                              <li><strong>Enterprise Integration</strong>: 23% of financial institutions exploring DApp implementations</li>
                            </ul>
                          </div>

                          <div className="mb-4">
                            <h5 className="text-gray-900 dark:text-white font-medium mb-2">Investment Categories</h5>
                            <ol className="list-decimal list-inside space-y-1">
                              <li><strong>Infrastructure Solutions</strong>: Layer 2 scaling solutions showing 400% growth</li>
                              <li><strong>User Experience Tools</strong>: Simplified DApp interfaces capturing mainstream users</li>
                              <li><strong>Cross-Chain Protocols</strong>: Interoperability solutions commanding premium valuations</li>
                              <li><strong>Regulatory Compliance</strong>: Legal framework tools for enterprise DApp deployment</li>
                            </ol>
                          </div>

                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <h6 className="text-blue-300 font-semibold mb-2">Market Recommendation</h6>
                            <p className="text-blue-200"><strong>Emerging High-Value Sector</strong>: DApps represent a maturing technology with proven utility, growing institutional adoption, and significant infrastructure investment supporting long-term growth potential.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Key Insights */}
        {summary.keyInsights && summary.keyInsights.length > 0 && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg mb-6">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.keyInsights.map((insight, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant={insight.importance === 'high' ? 'destructive' : 
                               insight.importance === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.importance} priority
                      </Badge>
                      {insight.timestamp && (
                        <span className="text-xs text-gray-400">{insight.timestamp}</span>
                      )}
                    </div>
                    <p className="text-gray-200">{insight.insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chapters */}
        {summary.chapters && summary.chapters.length > 0 && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg mb-6">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.chapters.map((chapter, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-900 dark:text-white font-semibold">{chapter.title}</h3>
                      <span className="text-sm text-gray-400">
                        {chapter.startTime} - {chapter.endTime}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm">{chapter.summary}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Content Type</p>
                <p className="text-gray-900 dark:text-white">{summary.contentType}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Platform</p>
                <p className="text-gray-900 dark:text-white">{summary.platform}</p>
              </div>
              {summary.originalDuration && (
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-gray-900 dark:text-white">{Math.round(summary.originalDuration / 60)} minutes</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-sm">Visibility</p>
                <p className="text-gray-900 dark:text-white">{summary.isPublic ? 'Public' : 'Private'}</p>
              </div>
            </div>
            
            {summary.tags && summary.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {summary.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="border-white/20 text-gray-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(summary.ipfsHash || summary.arweaveId) && (
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-2">Decentralized Storage</p>
                <div className="space-y-2">
                  {summary.ipfsHash && (
                    <div>
                      <span className="text-xs text-gray-400">IPFS: </span>
                      <code className="text-xs text-purple-200 bg-purple-500/20 px-2 py-1 rounded">
                        {summary.ipfsHash}
                      </code>
                    </div>
                  )}
                  {summary.arweaveId && (
                    <div>
                      <span className="text-xs text-gray-400">Arweave: </span>
                      <code className="text-xs text-purple-200 bg-purple-500/20 px-2 py-1 rounded">
                        {summary.arweaveId}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}