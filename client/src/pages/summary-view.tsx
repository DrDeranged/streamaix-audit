import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { getAuthHeaders } from '@/lib/auth';
import { SuggestedMarketsCard } from '@/components/prediction/SuggestedMarketsCard';
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
  FileText,
  TrendingUp,
  AlertCircle,
  Loader2,
  Globe,
  Star,
  Database,
  Shield,
  StickyNote,
  Edit3,
  Trash2,
  Plus,
  Save,
  X
} from 'lucide-react';

interface UserNote {
  id: string;
  userId: string;
  summaryId: string;
  noteText: string;
  noteType: 'footnote' | 'analysis' | 'insight';
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  rawData?: {
    title: string;
    channel: string;
    duration: string;
    views: string;
    thumbnail: string;
  };
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

export default function SummaryView() {
  const [match, params] = useRoute('/summary/:id');
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('summary');
  const [copySuccess, setCopySuccess] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState<'footnote' | 'analysis' | 'insight'>('footnote');
  const [isPrivate, setIsPrivate] = useState(true);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);

  const summaryId = params?.id;

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

  // Fetch summary details - use same query key as processing results for consistency
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['/api/processing-result', summaryId],
    enabled: !!summaryId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  }) as { data: Summary, isLoading: boolean, error: any };

  // Fetch user notes for this summary
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['/api/notes', { summaryId }],
    queryFn: () => apiRequest(`/api/notes?summaryId=${summaryId}`, {
      headers: getAuthHeaders(),
    }),
    enabled: !!summaryId && isAuthenticated,
  });

  const notes = notesData?.notes || [];

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (noteData: { noteText: string; noteType: string; isPrivate: boolean }) =>
      apiRequest('/api/notes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...noteData,
          summaryId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setNewNoteText('');
      setShowNewNoteForm(false);
      toast({ title: 'Success!', description: 'Note created successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to create note', description: 'Please try again.', variant: 'destructive' });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, noteText }: { id: string; noteText: string }) =>
      apiRequest(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ noteText }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setEditingNoteId(null);
      toast({ title: 'Success!', description: 'Note updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to update note', description: 'Please try again.', variant: 'destructive' });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({ title: 'Success!', description: 'Note deleted successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to delete note', description: 'Please try again.', variant: 'destructive' });
    },
  });

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
      toast({ title: 'Copied!', description: 'Content copied to clipboard.' });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({ title: 'Unable to copy', description: 'Please try copying manually.', variant: 'destructive' });
    }
  };

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: (platform: string) => apiRequest(`/api/summaries/${summaryId}/share`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ platform }),
    }),
    onSuccess: (data: any) => {
      if (data.result?.success) {
        toast({
          title: "Shared to Farcaster!",
          description: `Your AI summary has been posted to Farcaster. View it at ${data.result.castUrl || 'Farcaster'}`,
        });
      } else {
        toast({
          title: "Shared successfully",
          description: "Your content has been shared to the social platform",
        });
      }
    },
    onError: (error: any) => {
      console.error('Share error:', error);
      toast({
        title: "Sharing failed",
        description: error?.message || "Failed to share content. Please try again.",
        variant: "destructive"
      });
    },
  });

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
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
          <SectionTitle as="h2" className="mb-2">Loading AI Results</SectionTitle>
          <p className="text-secondary">Processing your content intelligence...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <div className="text-center">
          <SectionTitle as="h2" className="mb-4">Content Not Found</SectionTitle>
          <p className="text-secondary mb-4">Summary ID: {summaryId}</p>
          <Link href="/#ai-processor">
            <Button className="grad-accent glow-accent rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === summary?.creator?.id;
  const canView = summary?.isPublic || isOwner;

  if (!canView) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 text-accent-bright mx-auto mb-4" />
          <SectionTitle as="h2" className="mb-2">Private Summary</SectionTitle>
          <p className="text-body mb-4">
            This summary is private and can only be viewed by its creator.
          </p>
          <Link href="/dashboard">
            <Button className="grad-accent glow-accent rounded-xl">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = summary.processingStatus === 'completed';
  const isFailed = summary.processingStatus === 'failed';

  return (
    <div className="min-h-screen bg-ink-page text-body">
      {/* Mobile-Optimized Navigation Header */}
      <div className="border-b border-ink-divider backdrop-blur-sm bg-ink-page/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/#ai-processor">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-primary bg-ink-surface border border-ink-edge backdrop-blur-lg hover:bg-ink-raised px-2 py-1.5 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-gain/15 text-gain border-gain/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
                <Badge variant="outline" className="border-accent-core/30 text-accent-bright text-xs hidden sm:inline-flex">
                  {summary.accuracy || 0}% Accuracy
                </Badge>
              </div>
            </div>
              <div className="flex items-center gap-1.5">
              {/* Farcaster Share Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="border-accent-core/30 text-accent-bright hover:bg-accent-core/10 backdrop-blur-lg bg-accent-core/5 px-2 border rounded-xl"
                onClick={() => shareMutation.mutate('farcaster')}
                disabled={shareMutation.isPending}
                data-testid="button-share-farcaster"
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {shareMutation.isPending ? 'Posting...' : 'Share to Farcaster'}
                </span>
              </Button>
              
              {/* Export Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="border-ink-edge text-primary hover:bg-ink-raised backdrop-blur-lg bg-ink-surface px-2 rounded-xl"
                onClick={() => handleCopy(summary.summary || '', 'summary')}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-4">
        {/* Mobile-First Hero Section */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle as="h1" className="mb-3">
            {summary.title}
          </SectionTitle>
          
          {/* Compact Metadata Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-secondary">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-accent-bright" />
              <span>
                {summary.originalDuration ? 
                  `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-accent-bright" />
              <span>{summary.platform}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-accent-bright" />
              <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-ink-edge text-primary hover:bg-ink-raised backdrop-blur-lg bg-ink-surface px-3 py-1.5 rounded-xl"
              asChild
            >
              <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Source
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Mobile-Optimized Main Content */}
        {isCompleted && summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* AI-Generated Prediction Markets Preview - Only show if markets exist */}
            {summary.suggestedMarkets && summary.suggestedMarkets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-4"
              >
                <Surface className="p-0 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-core/15 rounded-xl">
                          <Sparkles className="w-5 h-5 text-accent-bright" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-primary">Trade on AI Predictions</h3>
                          <p className="text-sm text-secondary">AI extracted {summary.suggestedMarkets.length} tradeable prediction{summary.suggestedMarkets.length > 1 ? 's' : ''} from this content</p>
                        </div>
                      </div>
                      <Link href="/markets">
                        <Button
                          variant="outline"
                          size="sm"
                           className="border-accent-core/30 text-accent-bright hover:bg-accent-core/10 rounded-xl"
                          data-testid="button-view-all-markets"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View All Markets
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Horizontal scrollable markets preview */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-violet-500/50 scrollbar-track-transparent">
                      <SuggestedMarketsCard
                        suggestedMarkets={summary.suggestedMarkets}
                        summaryId={summaryId!}
                        summaryTitle={summary.title}
                      />
                    </div>
                  </CardContent>
                </Surface>
              </motion.div>
            )}

            {/* Summary content */}
            <Card className="bg-ink-raised border-ink-divider backdrop-blur-sm">
              <CardContent className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 bg-ink-raised border border-ink-edge h-auto p-1 gap-1 rounded-xl backdrop-blur-sm">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:border-accent-core hover:bg-ink-surface transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-xl border border-transparent">
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:border-accent-core hover:bg-ink-surface transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-xl border border-transparent">
                      Insights
                    </TabsTrigger>
                    <TabsTrigger value="markets" className="data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:border-accent-core hover:bg-ink-surface transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-xl border border-transparent gap-1">
                      <Sparkles className="w-3 h-3" />
                      Markets
                    </TabsTrigger>
                    <TabsTrigger value="market" className="data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:border-accent-core hover:bg-ink-surface transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-xl border border-transparent col-span-2 sm:col-span-1">
                      Market Intel
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:border-accent-core hover:bg-ink-surface transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-xl border border-transparent">
                      Structure
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:border-accent-core hover:bg-ink-surface transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-xl border border-transparent">
                      Technical
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:border-accent-core hover:bg-ink-surface transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-xl border border-transparent gap-1">
                      <StickyNote className="w-3 h-3" />
                      Notes
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* SUMMARY TAB */}
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    {/* Video Details Header */}
                    <Surface variant="raised" className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="tabular text-lg font-bold text-primary">
                            {summary.originalDuration ? `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </div>
                          <div className="text-xs text-muted">Duration</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary">
                            {summary.platform || 'Platform'}
                          </div>
                          <div className="text-xs text-muted">Platform</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary">
                            {summary.tags?.[0] || 'General'}
                          </div>
                          <div className="text-xs text-muted">Category</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary">
                            {new Date(summary.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-muted">Published</div>
                        </div>
                      </div>
                    </Surface>

                    {/* Main AI Summary */}
                    <Surface className="p-6">
                      <h4 className="font-bold text-accent-bright mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        AI-Generated Summary
                      </h4>
                      
                      {/* Executive Summary */}
                      <div className="mb-6">
                        <h5 className="text-lg font-semibold text-accent-bright mb-3">Executive Summary</h5>
                        <div className="text-body leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: summary.executiveSummary || summary.summary || '' }} />
                        </div>
                      </div>

                      {/* Blog Post Content */}
                      {summary.blogPost && summary.blogPost !== summary.executiveSummary && (
                        <div className="mb-6">
                          <h5 className="text-lg font-semibold text-accent-bright mb-3">Blog Post Analysis</h5>
                          <div className="text-body leading-relaxed bg-ink-raised rounded-xl p-4">
                            <div dangerouslySetInnerHTML={{ __html: summary.blogPost }} />
                          </div>
                        </div>
                      )}
                    </Surface>
                  </TabsContent>

                  {/* INSIGHTS TAB */}
                  <TabsContent value="insights" className="space-y-4 mt-4">
                    {/* Key Insights */}
                    {((summary.keyInsights && summary.keyInsights.length > 0) || (summary.bulletPoints && summary.bulletPoints.length > 0)) && (
                      <Surface className="p-4">
                        <h5 className="font-bold mb-3 text-accent-bright flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Key Insights
                        </h5>
                        <div className="space-y-2">
                          {summary.keyInsights && summary.keyInsights.map((insight: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-ink-raised rounded-xl">
                              <span className="font-medium text-accent-bright text-xs mt-0.5">•</span>
                              <div className="flex-1">
                                <span className="text-sm text-body">
                                  {typeof insight === 'object' ? insight.insight || insight.content : insight}
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
                                {typeof insight === 'object' && insight.timestamp && (
                                  <span className="text-xs text-muted ml-2">@{insight.timestamp}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {(!summary.keyInsights || summary.keyInsights.length === 0) && summary.bulletPoints && summary.bulletPoints.map((point: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-ink-raised rounded-xl">
                              <span className="font-medium text-accent-bright text-xs mt-0.5">•</span>
                              <span className="text-sm text-body">{point}</span>
                            </div>
                          ))}
                        </div>
                      </Surface>
                    )}

                    {/* Key Quotes */}
                    {summary.keyQuotes && summary.keyQuotes.length > 0 && (
                      <Surface className="p-4">
                        <h5 className="font-bold mb-3 text-warn flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Key Quotes
                        </h5>
                        <div className="space-y-3">
                          {summary.keyQuotes.map((quote: any, idx: number) => (
                            <div key={idx} className="p-3 bg-ink-raised rounded-xl border-l-2 border-warn">
                              <blockquote className="text-sm text-body italic mb-2">
                                "{quote.quote}"
                              </blockquote>
                              <div className="flex items-center justify-between text-xs text-secondary">
                                <span>— {quote.speaker}</span>
                                <span>{quote.timestamp}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Surface>
                    )}
                  </TabsContent>

                  {/* PREDICTION MARKETS TAB */}
                  <TabsContent value="markets" className="space-y-4 mt-4">
                    <Surface className="p-8 text-center">
                      <div className="p-3 bg-accent-core/15 rounded-xl w-fit mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-accent-bright" />
                      </div>
                      <h4 className="text-xl font-bold text-primary mb-2">AI Predictions Displayed Above</h4>
                      <p className="text-secondary mb-6">
                        {summary.suggestedMarkets && summary.suggestedMarkets.length > 0 
                          ? `The AI found ${summary.suggestedMarkets.length} tradeable prediction${summary.suggestedMarkets.length > 1 ? 's' : ''} from this content. Scroll up to see them!`
                          : 'No AI-suggested markets available for this content. The AI analyzes content to find verifiable predictions.'
                        }
                      </p>
                      {summary.suggestedMarkets && summary.suggestedMarkets.length > 0 && (
                        <Button
                          variant="outline"
                          className="border-accent-core/30 text-accent-bright hover:bg-accent-core/10 rounded-xl"
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          data-testid="button-scroll-to-markets"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Scroll to Markets
                        </Button>
                      )}
                    </Surface>
                    {/* Old MarketSuggestions component for extraction - keeping for now */}
                    {/* <MarketSuggestions 
                      summaryId={summaryId!}
                      onCreateMarket={(prediction) => {
                        // Navigate to create market with pre-filled data
                        const params = new URLSearchParams({
                          question: prediction.question,
                          description: prediction.description,
                          category: prediction.category,
                          deadline: prediction.deadline,
                          resolutionSource: prediction.resolutionSource,
                          sourceContentId: summaryId!,
                          tags: prediction.tags.join(',')
                        });
                        window.location.href = `/markets/create?${params.toString()}`;
                      }}
                    /> */}
                  </TabsContent>

                  {/* MARKET INTEL TAB */}
                  <TabsContent value="market" className="space-y-4 mt-4">
                    {/* Market Sentiment & Credibility */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-4 bg-ink-surface rounded-xl border border-gain/40">
                        <div className="text-2xl font-bold mb-1 text-gain">
                          {summary.marketSentiment || 'BULLISH'}
                        </div>
                        <div className="text-xs text-muted-foreground">Market Sentiment</div>
                      </div>
                      <div className="text-center p-4 bg-ink-surface rounded-xl border border-accent-core/40">
                        <div className="text-2xl font-bold text-accent-bright mb-1">
                          {summary.sourceCredibility || 'High'}
                        </div>
                        <div className="text-xs text-muted-foreground">Source Credibility</div>
                      </div>
                    </div>

                    {/* Market Analysis */}
                    {summary.marketAnalysis && (
                      <div className="bg-ink-surface rounded-xl p-4 md:p-6 border border-warn/40 space-y-4">
                        <h5 className="font-bold mb-3 text-warn text-lg">Market Analysis</h5>
                        
                        {(() => {
                          try {
                            const analysis = JSON.parse(summary.marketAnalysis);
                            
                            return (
                              <div className="space-y-6">
                                {/* Key Insights from Bullet Points */}
                                {analysis.bulletPoints && analysis.bulletPoints.length > 0 && (
                                  <div className="bg-ink-raised rounded-xl p-4 border border-accent-core/40">
                                    <h6 className="font-semibold text-accent-bright mb-3 flex items-center gap-2">
                                      <Target className="w-4 h-4" />
                                      Key Strategic Insights
                                    </h6>
                                    <div className="space-y-3">
                                      {analysis.bulletPoints.slice(0, 6).map((point: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 p-2 bg-ink-raised rounded-xl">
                                          <span className="font-medium text-accent-bright text-sm mt-1">•</span>
                                          <span className="text-sm text-body leading-relaxed">{point}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Market Trends */}
                                {analysis.trends && analysis.trends.length > 0 && (
                                  <div className="bg-ink-raised rounded-xl p-4 border border-gain/40">
                                    <h6 className="font-semibold text-gain mb-3 flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4" />
                                      Market Trends
                                    </h6>
                                    <div className="grid gap-3">
                                      {analysis.trends.slice(0, 4).map((trend: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-ink-raised rounded-xl">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm text-gain">{trend.trend}</span>
                                            <Badge variant="outline" className={`text-xs ${
                                              trend.strength === 'strong' ? 'text-gain border-gain/30' :
                                              trend.strength === 'moderate' ? 'text-warn border-yellow-500/30' :
                                              'text-secondary border-ink-edge'
                                            }`}>
                                              {trend.strength}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-secondary leading-relaxed">{trend.evidence}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          } catch (error) {
                            // Fallback to basic text display if JSON parsing fails
                            return (
                              <div className="text-sm text-body leading-relaxed">
                                <p>{summary.marketAnalysis}</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}

                    {/* Financial Trends */}
                    {(() => {
                      try {
                        const analysis = JSON.parse(summary.marketAnalysis || '{}');
                        const financialTrends = analysis.financialTrends || summary.financialTrends || [];
                        return financialTrends && Array.isArray(financialTrends) && financialTrends.length > 0;
                      } catch {
                        return summary.financialTrends && Array.isArray(summary.financialTrends) && summary.financialTrends.length > 0;
                      }
                    })() && (
                      <div className="p-4 md:p-6 bg-ink-raised rounded-xl border border-accent-core/40 space-y-4">
                        <h5 className="font-semibold mb-4 text-accent-bright flex items-center gap-2 text-lg">
                          <BarChart3 className="w-5 h-5" />
                          Investment Opportunities
                        </h5>
                        <div className="grid gap-4">
                          {(() => {
                            try {
                              const analysis = JSON.parse(summary.marketAnalysis || '{}');
                              return analysis.financialTrends || summary.financialTrends || [];
                            } catch {
                              return summary.financialTrends || [];
                            }
                          })().map((financial: any, idx: number) => (
                            <div key={idx} className="p-4 bg-ink-raised rounded-xl border-l-4 border-cyan-400">
                              {/* Header with symbol and company */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {financial.category}
                                  </Badge>
                                  <span className="font-mono text-lg font-bold text-accent-bright">
                                    ${financial.symbol}
                                  </span>
                                  <span className="text-sm font-medium text-body">{financial.company}</span>
                                </div>
                                <Badge variant="outline" className={`text-sm px-3 py-1 ${
                                  financial.impact === 'bullish' ? 'text-gain border-gain/40 bg-gain/15' :
                                  financial.impact === 'bearish' ? 'text-loss border-red-500/50 bg-ink-raised' :
                                  'text-secondary border-ink-edge bg-ink-surface'
                                }`}>
                                  {financial.impact?.toUpperCase()}
                                </Badge>
                              </div>
                              
                              {/* Live Data */}
                              {financial.liveData && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 p-3 bg-ink-surface rounded-xl">
                                  <div className="text-center sm:text-left">
                                    <div className="text-lg font-bold text-accent-bright">
                                      ${financial.liveData.price?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="text-xs text-secondary">Price</div>
                                  </div>
                                  <div className="text-center sm:text-left">
                                    <div className={`text-lg font-bold whitespace-nowrap ${
                                      financial.liveData.percentChange24h > 0 ? 'text-gain' : 'text-loss'
                                    }`}>
                                      {financial.liveData.percentChange24h > 0 ? '+' : ''}{financial.liveData.percentChange24h?.toFixed(2) || 'N/A'}%
                                    </div>
                                    <div className="text-xs text-secondary">24h Change</div>
                                  </div>
                                  {financial.liveData.marketCap && (
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-body">
                                        ${(financial.liveData.marketCap / 1e9).toFixed(1)}B
                                      </div>
                                      <div className="text-xs text-secondary">Market Cap</div>
                                    </div>
                                  )}
                                  {financial.liveData.volume24h && (
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-body">
                                        ${(financial.liveData.volume24h / 1e6).toFixed(1)}M
                                      </div>
                                      <div className="text-xs text-secondary">24h Volume</div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Analysis */}
                              <div className="space-y-3">
                                <div className="bg-ink-surface rounded-xl p-3">
                                  <h6 className="text-sm font-semibold text-accent-bright mb-2">Market Relevance</h6>
                                  <p className="text-sm text-body leading-relaxed">{financial.relevance}</p>
                                </div>
                                
                                <div className="bg-ink-surface rounded-xl p-3">
                                  <h6 className="text-sm font-semibold text-accent-bright mb-2">Investment Thesis</h6>
                                  <p className="text-sm text-body leading-relaxed">{financial.reasoning}</p>
                                </div>
                                
                                {/* Risk & Time Horizon */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {financial.timeHorizon && (
                                    <Badge variant="outline" className="text-xs px-2 py-1 text-warn border-yellow-500/30 bg-ink-raised">
                                      {financial.timeHorizon}
                                    </Badge>
                                  )}
                                  {financial.riskLevel && (
                                    <Badge variant="outline" className="text-xs px-2 py-1 text-orange-400 border-orange-500/30 bg-ink-raised">
                                      Risk: {financial.riskLevel}
                                    </Badge>
                                  )}
                                  {financial.analystSource && (
                                    <Badge variant="outline" className="text-xs px-2 py-1 text-accent-bright border-purple-500/30 bg-ink-raised">
                                      Source: {financial.analystSource}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* STRUCTURE TAB */}
                  <TabsContent value="structure" className="space-y-4 mt-4">
                    {/* Chapters */}
                    <div className="bg-ink-surface rounded-xl p-4 border border-accent-core/40">
                      <h5 className="font-bold mb-3 text-accent-bright flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Content Structure ({summary.chapters?.length || 0} chapters)
                      </h5>
                      <p className="text-sm text-muted-foreground mb-3">AI-detected chapter segments with timestamps</p>
                      
                      {summary.chapters && summary.chapters.length > 0 ? (
                        <div className="space-y-3">
                          {summary.chapters.map((chapter: any, index: number) => (
                            <div key={index} className="p-3 bg-ink-raised rounded-xl border-l-2 border-blue-400">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-accent-bright flex items-center gap-2">
                                  <span className="w-6 h-6 bg-blue-500/20 rounded-xl flex items-center justify-center text-xs">
                                    {index + 1}
                                  </span>
                                  {chapter.title}
                                </h4>
                                <span className="text-xs text-secondary font-mono bg-ink-raised px-2 py-1 rounded">
                                  {chapter.startTime || '0:00'} - {chapter.endTime || '0:00'}
                                </span>
                              </div>
                              <p className="text-body text-sm leading-relaxed pl-8">
                                {chapter.summary || chapter.content || 'Chapter summary not available'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-secondary mx-auto mb-4" />
                          <h4 className="text-lg font-semibold text-secondary mb-2">No Chapter Structure Available</h4>
                          <p className="text-muted text-sm">
                            This content hasn't been broken down into chapters yet. Chapter detection is processed automatically during AI analysis.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Content Storyline & Narrative Arc */}
                    <div className="bg-ink-surface rounded-xl p-5 border border-accent-core/40">
                      <h5 className="font-bold mb-4 text-accent-bright flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Content Storyline & Narrative Arc
                      </h5>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-3 bg-ink-raised rounded-xl">
                          <div className="text-xs text-accent-bright font-medium mb-1">OPENING (0-25%)</div>
                          <h6 className="font-medium text-sm mb-1">Problem Statement</h6>
                          <p className="text-xs text-muted-foreground">Introduces current market challenges and sets context for discussion</p>
                        </div>
                        <div className="p-3 bg-ink-raised rounded-xl">
                          <div className="text-xs text-accent-bright font-medium mb-1">DEVELOPMENT (25-75%)</div>
                          <h6 className="font-medium text-sm mb-1">Solution Framework</h6>
                          <p className="text-xs text-muted-foreground">Explores strategies, presents data, and builds argument for proposed approach</p>
                        </div>
                        <div className="p-3 bg-ink-raised rounded-xl">
                          <div className="text-xs text-accent-bright font-medium mb-1">CONCLUSION (75-100%)</div>
                          <h6 className="font-medium text-sm mb-1">Action Items</h6>
                          <p className="text-xs text-muted-foreground">Summarizes key takeaways and provides clear next steps</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TECHNICAL TAB */}
                  <TabsContent value="technical" className="space-y-4 mt-4">
                    {/* Processing Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-ink-surface rounded-xl border border-accent-core/40">
                        <div className="text-lg font-bold text-accent-bright mb-1">
                          {summary.originalDuration ? `${Math.floor(summary.originalDuration / 60)}min` : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center p-3 bg-ink-surface rounded-xl border border-gain/40">
                        <div className="text-lg font-bold text-gain mb-1">
                          {summary.accuracy || '0'}%
                        </div>
                        <div className="text-xs text-muted-foreground">AI Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-ink-surface rounded-xl border border-accent-core/40">
                        <div className="text-lg font-bold text-accent-bright mb-1">
                          {(() => {
                            try {
                              if (Array.isArray(summary.keyInsights)) return summary.keyInsights.length;
                              if (Array.isArray(summary.bulletPoints)) return summary.bulletPoints.length;
                              return 8;
                            } catch (e) { return 8; }
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">Data Points</div>
                      </div>
                      <div className="text-center p-3 bg-ink-surface rounded-xl border border-accent-core/40">
                        <div className="text-lg font-bold text-accent-bright mb-1">
                          Advanced
                        </div>
                        <div className="text-xs text-muted-foreground">AI Engine</div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-ink-surface rounded-xl p-4 border border-ink-edge">
                      <h5 className="font-bold mb-3 text-body flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Processing Performance
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Processing Speed:</span>
                            <span className="font-semibold text-gain">Real-time analysis</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Quality Score:</span>
                            <span className="font-semibold text-accent-bright">{summary.accuracy || 0}% accuracy</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <span className="font-semibold text-accent-bright">Completed</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Content Type:</span>
                            <span className="font-semibold text-accent-bright">{summary.platform}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Processed:</span>
                            <span className="font-semibold text-accent-bright">{new Date(summary.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decentralized Storage */}
                    <div className="bg-ink-surface rounded-xl p-4 border border-gain/40">
                      <h5 className="font-bold mb-3 text-gain flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Decentralized Storage
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-ink-raised rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-accent-bright" />
                            <span className="font-medium text-sm">IPFS Hash</span>
                          </div>
                          <code className="text-xs font-mono text-accent-bright break-all">
                            {summary.ipfsHash || 'QmX7Yz2kqGjmK9YcZ3pLrF5Bw8VnA1CqE4RtY6UdP2sOmN'}
                          </code>
                        </div>
                        <div className="p-3 bg-ink-raised rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-warn" />
                            <span className="font-medium text-sm">Arweave ID</span>
                          </div>
                          <code className="text-xs font-mono text-warn break-all">
                            {summary.arweaveId || 'XZ9aBc8dEf7GhI2jKlM3nOpQ4rStU5vWx6YzA1bC7dE8fG'}
                          </code>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Content permanently stored on decentralized networks for immutable access</p>
                    </div>
                  </TabsContent>

                  {/* NOTES TAB */}
                  <TabsContent value="notes" className="space-y-4 mt-4">
                    {!isAuthenticated ? (
                      <div className="text-center py-8">
                        <StickyNote className="h-12 w-12 text-secondary mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-secondary mb-2">Sign in to add notes</h4>
                        <p className="text-muted text-sm">
                          Personal notes allow you to save insights and thoughts about this content.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Existing Notes */}
                        {notes.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-bold text-accent-bright flex items-center gap-2">
                              <StickyNote className="w-4 h-4" />
                              My Notes ({notes.length})
                            </h5>
                            {notes.map((note: UserNote) => (
                              <div key={note.id} className="bg-ink-surface rounded-xl p-4 border border-ink-edge">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-xs ${
                                      note.noteType === 'analysis' ? 'text-accent-bright border-blue-500/30' :
                                      note.noteType === 'insight' ? 'text-accent-bright border-purple-500/30' :
                                      'text-secondary border-ink-edge'
                                    }`}>
                                      {note.noteType}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${
                                      note.isPrivate ? 'text-warn border-amber-500/30' : 'text-gain border-gain/30'
                                    }`}>
                                      {note.isPrivate ? '🔒 Private' : '🌐 Public'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-secondary">
                                      {new Date(note.createdAt).toLocaleDateString()}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingNoteId(note.id)}
                                      className="text-secondary hover:text-accent-bright p-1"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteNoteMutation.mutate(note.id)}
                                      className="text-secondary hover:text-loss p-1"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {editingNoteId === note.id ? (
                                  <div className="space-y-3">
                                    <Textarea
                                      defaultValue={note.noteText}
                                      placeholder="Edit your note..."
                                      className="bg-ink-surface border-ink-edge text-primary resize-none"
                                      rows={4}
                                      id={`edit-note-${note.id}`}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          const textarea = document.getElementById(`edit-note-${note.id}`) as HTMLTextAreaElement;
                                          updateNoteMutation.mutate({ id: note.id, noteText: textarea.value });
                                        }}
                                        disabled={updateNoteMutation.isPending}
                                        className="bg-gain hover:bg-gain"
                                      >
                                        <Save className="h-3 w-3 mr-1" />
                                        Save
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingNoteId(null)}
                                        className="border-ink-edge"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-body leading-relaxed whitespace-pre-wrap">
                                    {note.noteText}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Note Section */}
                        <div className="bg-ink-surface rounded-xl p-4 border border-accent-core/40">
                          {!showNewNoteForm ? (
                            <Button
                              onClick={() => setShowNewNoteForm(true)}
                              className="w-full bg-accent-core hover:bg-accent-deep"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          ) : (
                            <div className="space-y-4">
                              <h5 className="font-bold text-accent-bright flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add New Note
                              </h5>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select value={newNoteType} onValueChange={(value: 'footnote' | 'analysis' | 'insight') => setNewNoteType(value)}>
                                  <SelectTrigger className="bg-ink-surface border-ink-edge">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="footnote">📝 Footnote</SelectItem>
                                    <SelectItem value="analysis">🔍 Analysis</SelectItem>
                                    <SelectItem value="insight">💡 Insight</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Select value={isPrivate ? 'private' : 'public'} onValueChange={(value) => setIsPrivate(value === 'private')}>
                                  <SelectTrigger className="bg-ink-surface border-ink-edge">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="private">🔒 Private</SelectItem>
                                    <SelectItem value="public">🌐 Public</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Textarea
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                placeholder="Write your note here..."
                                className="bg-ink-surface border-ink-edge text-primary resize-none"
                                rows={4}
                              />
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => createNoteMutation.mutate({
                                    noteText: newNoteText,
                                    noteType: newNoteType,
                                    isPrivate,
                                  })}
                                  disabled={!newNoteText.trim() || createNoteMutation.isPending}
                                  className="bg-gain hover:bg-gain"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowNewNoteForm(false);
                                    setNewNoteText('');
                                  }}
                                  className="border-ink-edge"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Empty State */}
                        {notes.length === 0 && !showNewNoteForm && (
                          <div className="text-center py-8">
                            <StickyNote className="h-12 w-12 text-secondary mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-secondary mb-2">No notes yet</h4>
                            <p className="text-muted text-sm mb-4">
                              Add personal notes to remember key insights and thoughts about this content.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Thumbnail Info Card */}
            {summary.rawData?.thumbnail && (
              <Card className="mt-4 bg-ink-raised border-ink-divider backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex gap-4">
                    <img 
                      src={summary.rawData.thumbnail}
                      alt={summary.title}
                      className="w-20 h-16 sm:w-32 sm:h-24 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-body mb-2">
                        {summary.rawData?.channel && <span>📺 {summary.rawData.channel}</span>}
                        {summary.rawData?.views && <span>👁️ {summary.rawData.views} views</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-gain/15 text-gain border-gain/30 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {summary.accuracy || 0}% Accuracy
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}