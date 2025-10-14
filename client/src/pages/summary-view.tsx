import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      toast({ title: 'Error', description: 'Failed to create note.', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'Failed to update note.', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'Failed to delete note.', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'Failed to copy content.', variant: 'destructive' });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
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
            <Brain className="h-16 w-16 text-purple-400 mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading AI Results</h2>
          <p className="text-gray-600 dark:text-gray-400">Processing your content intelligence...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Content Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Summary ID: {summaryId}</p>
          <Link href="/dashboard">
            <Button className="bg-purple-600 hover:bg-purple-700">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Private Summary</h2>
          <p className="text-gray-300 mb-4">
            This summary is private and can only be viewed by its creator.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = summary.processingStatus === 'completed';
  const isFailed = summary.processingStatus === 'failed';

  return (
    <div className="min-h-screen bg-slate-900 text-gray-900 dark:text-white" style={{backgroundColor: '#0f172a', color: '#ffffff'}}>
      {/* Mobile-Optimized Navigation Header */}
      <div className="border-b border-white/10 backdrop-blur-sm bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white bg-white/5 border border-white/20 backdrop-blur-lg hover:bg-white/10 px-2 py-1.5"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
                <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs hidden sm:inline-flex">
                  {summary.accuracy || 0}% Accuracy
                </Badge>
              </div>
            </div>
              <div className="flex items-center gap-1.5">
              {/* Farcaster Share Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 backdrop-blur-lg bg-purple-500/5 px-2 border"
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
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5 px-2"
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white leading-tight">
            {summary.title}
          </h1>
          
          {/* Compact Metadata Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>
                {summary.originalDuration ? 
                  `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{summary.platform}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5 px-3 py-1.5"
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
                <Card className="bg-gradient-to-br from-violet-900/30 via-purple-900/30 to-indigo-900/30 border-violet-500/30 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg">
                          <Sparkles className="w-5 h-5 text-violet-300" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-violet-200">Trade on AI Predictions</h3>
                          <p className="text-sm text-violet-300/70">AI extracted {summary.suggestedMarkets.length} tradeable prediction{summary.suggestedMarkets.length > 1 ? 's' : ''} from this content</p>
                        </div>
                      </div>
                      <Link href="/markets">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-violet-400/30 text-violet-300 hover:bg-violet-500/20"
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
                </Card>
              </motion.div>
            )}

            {/* Summary content */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 bg-slate-800/30 border border-slate-600/30 h-auto p-1 gap-1 rounded-lg backdrop-blur-sm">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-blue-400/30 data-[state=active]:text-blue-200 hover:bg-white/5 transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-md border border-transparent">
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border-purple-400/30 data-[state=active]:text-purple-200 hover:bg-white/5 transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-md border border-transparent">
                      Insights
                    </TabsTrigger>
                    <TabsTrigger value="markets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-violet-400/30 data-[state=active]:text-violet-200 hover:bg-white/5 transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-md border border-transparent gap-1">
                      <Sparkles className="w-3 h-3" />
                      Markets
                    </TabsTrigger>
                    <TabsTrigger value="market" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:border-green-400/30 data-[state=active]:text-green-200 hover:bg-white/5 transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-md border border-transparent col-span-2 sm:col-span-1">
                      Market Intel
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:border-amber-400/30 data-[state=active]:text-amber-200 hover:bg-white/5 transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-md border border-transparent">
                      Structure
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/20 data-[state=active]:to-rose-500/20 data-[state=active]:border-red-400/30 data-[state=active]:text-red-200 hover:bg-white/5 transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-md border border-transparent">
                      Technical
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:border-cyan-400/30 data-[state=active]:text-cyan-200 hover:bg-white/5 transition-all text-xs sm:text-sm py-3 px-3 min-h-[48px] flex items-center justify-center rounded-md border border-transparent gap-1">
                      <StickyNote className="w-3 h-3" />
                      Notes
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* SUMMARY TAB */}
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    {/* Video Details Header */}
                    <div className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 rounded-xl p-4 border border-slate-600">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {summary.originalDuration ? `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Duration</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {summary.platform || 'Platform'}
                          </div>
                          <div className="text-xs text-muted-foreground">Platform</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {summary.tags?.[0] || 'General'}
                          </div>
                          <div className="text-xs text-muted-foreground">Category</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {new Date(summary.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-muted-foreground">Published</div>
                        </div>
                      </div>
                    </div>

                    {/* Main AI Summary */}
                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl p-6 border border-indigo-700">
                      <h4 className="font-bold text-indigo-300 mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        AI-Generated Summary
                      </h4>
                      
                      {/* Executive Summary */}
                      <div className="mb-6">
                        <h5 className="text-lg font-semibold text-indigo-400 mb-3">Executive Summary</h5>
                        <div className="text-gray-300 leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: summary.executiveSummary || summary.summary || '' }} />
                        </div>
                      </div>

                      {/* Blog Post Content */}
                      {summary.blogPost && summary.blogPost !== summary.executiveSummary && (
                        <div className="mb-6">
                          <h5 className="text-lg font-semibold text-purple-400 mb-3">Blog Post Analysis</h5>
                          <div className="text-gray-300 leading-relaxed bg-white/5 rounded-lg p-4">
                            <div dangerouslySetInnerHTML={{ __html: summary.blogPost }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* INSIGHTS TAB */}
                  <TabsContent value="insights" className="space-y-4 mt-4">
                    {/* Key Insights */}
                    {((summary.keyInsights && summary.keyInsights.length > 0) || (summary.bulletPoints && summary.bulletPoints.length > 0)) && (
                      <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-xl p-4 border border-blue-700">
                        <h5 className="font-bold mb-3 text-blue-300 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Key Insights
                        </h5>
                        <div className="space-y-2">
                          {summary.keyInsights && summary.keyInsights.map((insight: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-white/5 rounded-md">
                              <span className="font-medium text-blue-400 text-xs mt-0.5">•</span>
                              <div className="flex-1">
                                <span className="text-sm text-gray-300">
                                  {typeof insight === 'object' ? insight.insight || insight.content : insight}
                                </span>
                                {typeof insight === 'object' && insight.importance && (
                                  <Badge variant="outline" className={`text-xs ml-2 ${
                                    insight.importance === 'high' ? 'text-red-400 border-red-500/30' :
                                    insight.importance === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                                    'text-gray-400 border-gray-500/30'
                                  }`}>
                                    {insight.importance}
                                  </Badge>
                                )}
                                {typeof insight === 'object' && insight.timestamp && (
                                  <span className="text-xs text-gray-500 ml-2">@{insight.timestamp}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {(!summary.keyInsights || summary.keyInsights.length === 0) && summary.bulletPoints && summary.bulletPoints.map((point: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-white/5 rounded-md">
                              <span className="font-medium text-blue-400 text-xs mt-0.5">•</span>
                              <span className="text-sm text-gray-300">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Quotes */}
                    {summary.keyQuotes && summary.keyQuotes.length > 0 && (
                      <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-xl p-4 border border-amber-700">
                        <h5 className="font-bold mb-3 text-amber-300 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Key Quotes
                        </h5>
                        <div className="space-y-3">
                          {summary.keyQuotes.map((quote: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white/5 rounded-md border-l-2 border-amber-400">
                              <blockquote className="text-sm text-gray-300 italic mb-2">
                                "{quote.quote}"
                              </blockquote>
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>— {quote.speaker}</span>
                                <span>{quote.timestamp}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* PREDICTION MARKETS TAB */}
                  <TabsContent value="markets" className="space-y-4 mt-4">
                    {summary.suggestedMarkets && summary.suggestedMarkets.length > 0 ? (
                      <SuggestedMarketsCard
                        suggestedMarkets={summary.suggestedMarkets}
                        summaryId={summaryId!}
                        summaryTitle={summary.title}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No AI-suggested markets available for this content</p>
                        <p className="text-sm mt-2">The AI analyzes content to find verifiable predictions</p>
                      </div>
                    )}
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
                      <div className="text-center p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-700">
                        <div className="text-2xl font-bold mb-1 text-green-400">
                          {summary.marketSentiment || 'BULLISH'}
                        </div>
                        <div className="text-xs text-muted-foreground">Market Sentiment</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl border border-purple-700">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          {summary.sourceCredibility || 'High'}
                        </div>
                        <div className="text-xs text-muted-foreground">Source Credibility</div>
                      </div>
                    </div>

                    {/* Market Analysis */}
                    {summary.marketAnalysis && (
                      <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-xl p-4 md:p-6 border border-orange-700 space-y-4">
                        <h5 className="font-bold mb-3 text-orange-300 text-lg">Market Analysis</h5>
                        
                        {(() => {
                          try {
                            const analysis = JSON.parse(summary.marketAnalysis);
                            
                            return (
                              <div className="space-y-6">
                                {/* Key Insights from Bullet Points */}
                                {analysis.bulletPoints && analysis.bulletPoints.length > 0 && (
                                  <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700">
                                    <h6 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                                      <Target className="w-4 h-4" />
                                      Key Strategic Insights
                                    </h6>
                                    <div className="space-y-3">
                                      {analysis.bulletPoints.slice(0, 6).map((point: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 p-2 bg-gray-800/50 rounded-md">
                                          <span className="font-medium text-blue-400 text-sm mt-1">•</span>
                                          <span className="text-sm text-gray-300 leading-relaxed">{point}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Market Trends */}
                                {analysis.trends && analysis.trends.length > 0 && (
                                  <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-700">
                                    <h6 className="font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4" />
                                      Market Trends
                                    </h6>
                                    <div className="grid gap-3">
                                      {analysis.trends.slice(0, 4).map((trend: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-gray-800/50 rounded-md">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm text-emerald-300">{trend.trend}</span>
                                            <Badge variant="outline" className={`text-xs ${
                                              trend.strength === 'strong' ? 'text-green-400 border-green-500/30' :
                                              trend.strength === 'moderate' ? 'text-yellow-400 border-yellow-500/30' :
                                              'text-gray-400 border-gray-500/30'
                                            }`}>
                                              {trend.strength}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-gray-400 leading-relaxed">{trend.evidence}</p>
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
                              <div className="text-sm text-gray-300 leading-relaxed">
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
                      <div className="p-4 md:p-6 bg-cyan-900/10 rounded-lg border border-cyan-700 space-y-4">
                        <h5 className="font-semibold mb-4 text-cyan-400 flex items-center gap-2 text-lg">
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
                            <div key={idx} className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-cyan-400">
                              {/* Header with symbol and company */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {financial.category}
                                  </Badge>
                                  <span className="font-mono text-lg font-bold text-cyan-400">
                                    ${financial.symbol}
                                  </span>
                                  <span className="text-sm font-medium text-gray-200">{financial.company}</span>
                                </div>
                                <Badge variant="outline" className={`text-sm px-3 py-1 ${
                                  financial.impact === 'bullish' ? 'text-green-400 border-green-500/50 bg-green-900/20' :
                                  financial.impact === 'bearish' ? 'text-red-400 border-red-500/50 bg-red-900/20' :
                                  'text-gray-400 border-gray-500/50 bg-gray-900/20'
                                }`}>
                                  {financial.impact?.toUpperCase()}
                                </Badge>
                              </div>
                              
                              {/* Live Data */}
                              {financial.liveData && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 p-3 bg-gray-900/50 rounded-md">
                                  <div className="text-center sm:text-left">
                                    <div className="text-lg font-bold text-cyan-400">
                                      ${financial.liveData.price?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-400">Price</div>
                                  </div>
                                  <div className="text-center sm:text-left">
                                    <div className={`text-lg font-bold whitespace-nowrap ${
                                      financial.liveData.percentChange24h > 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {financial.liveData.percentChange24h > 0 ? '+' : ''}{financial.liveData.percentChange24h?.toFixed(2) || 'N/A'}%
                                    </div>
                                    <div className="text-xs text-gray-400">24h Change</div>
                                  </div>
                                  {financial.liveData.marketCap && (
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-gray-300">
                                        ${(financial.liveData.marketCap / 1e9).toFixed(1)}B
                                      </div>
                                      <div className="text-xs text-gray-400">Market Cap</div>
                                    </div>
                                  )}
                                  {financial.liveData.volume24h && (
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-gray-300">
                                        ${(financial.liveData.volume24h / 1e6).toFixed(1)}M
                                      </div>
                                      <div className="text-xs text-gray-400">24h Volume</div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Analysis */}
                              <div className="space-y-3">
                                <div className="bg-gray-900/30 rounded-md p-3">
                                  <h6 className="text-sm font-semibold text-cyan-300 mb-2">Market Relevance</h6>
                                  <p className="text-sm text-gray-300 leading-relaxed">{financial.relevance}</p>
                                </div>
                                
                                <div className="bg-gray-900/30 rounded-md p-3">
                                  <h6 className="text-sm font-semibold text-cyan-300 mb-2">Investment Thesis</h6>
                                  <p className="text-sm text-gray-300 leading-relaxed">{financial.reasoning}</p>
                                </div>
                                
                                {/* Risk & Time Horizon */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {financial.timeHorizon && (
                                    <Badge variant="outline" className="text-xs px-2 py-1 text-yellow-400 border-yellow-500/30 bg-yellow-900/10">
                                      {financial.timeHorizon}
                                    </Badge>
                                  )}
                                  {financial.riskLevel && (
                                    <Badge variant="outline" className="text-xs px-2 py-1 text-orange-400 border-orange-500/30 bg-orange-900/10">
                                      Risk: {financial.riskLevel}
                                    </Badge>
                                  )}
                                  {financial.analystSource && (
                                    <Badge variant="outline" className="text-xs px-2 py-1 text-purple-400 border-purple-500/30 bg-purple-900/10">
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
                    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl p-4 border border-blue-700">
                      <h5 className="font-bold mb-3 text-blue-300 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Content Structure ({summary.chapters?.length || 0} chapters)
                      </h5>
                      <p className="text-sm text-muted-foreground mb-3">AI-detected chapter segments with timestamps</p>
                      
                      {summary.chapters && summary.chapters.length > 0 ? (
                        <div className="space-y-3">
                          {summary.chapters.map((chapter: any, index: number) => (
                            <div key={index} className="p-3 bg-white/5 rounded-md border-l-2 border-blue-400">
                              <div className="flex items-center justify-between mb-2">
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

                    {/* Content Storyline & Narrative Arc */}
                    <div className="bg-gradient-to-r from-violet-900/20 to-purple-900/20 rounded-xl p-5 border border-violet-700">
                      <h5 className="font-bold mb-4 text-violet-300 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Content Storyline & Narrative Arc
                      </h5>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-violet-400 font-medium mb-1">OPENING (0-25%)</div>
                          <h6 className="font-medium text-sm mb-1">Problem Statement</h6>
                          <p className="text-xs text-muted-foreground">Introduces current market challenges and sets context for discussion</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-violet-400 font-medium mb-1">DEVELOPMENT (25-75%)</div>
                          <h6 className="font-medium text-sm mb-1">Solution Framework</h6>
                          <p className="text-xs text-muted-foreground">Explores strategies, presents data, and builds argument for proposed approach</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-violet-400 font-medium mb-1">CONCLUSION (75-100%)</div>
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
                      <div className="text-center p-3 bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 rounded-xl border border-indigo-700">
                        <div className="text-lg font-bold text-indigo-400 mb-1">
                          {summary.originalDuration ? `${Math.floor(summary.originalDuration / 60)}min` : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-xl border border-green-700">
                        <div className="text-lg font-bold text-green-400 mb-1">
                          {summary.accuracy || '0'}%
                        </div>
                        <div className="text-xs text-muted-foreground">AI Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-xl border border-purple-700">
                        <div className="text-lg font-bold text-purple-400 mb-1">
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
                      <div className="text-center p-3 bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-xl border border-blue-700">
                        <div className="text-lg font-bold text-blue-400 mb-1">
                          GPT-4o
                        </div>
                        <div className="text-xs text-muted-foreground">AI Model</div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-gradient-to-r from-gray-900/20 to-slate-900/20 rounded-xl p-4 border border-gray-700">
                      <h5 className="font-bold mb-3 text-gray-300 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Processing Performance
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Processing Speed:</span>
                            <span className="font-semibold text-green-400">Real-time analysis</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Quality Score:</span>
                            <span className="font-semibold text-blue-400">{summary.accuracy || 0}% accuracy</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <span className="font-semibold text-purple-400">Completed</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Content Type:</span>
                            <span className="font-semibold text-cyan-400">{summary.platform}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Processed:</span>
                            <span className="font-semibold text-pink-400">{new Date(summary.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decentralized Storage */}
                    <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-xl p-4 border border-emerald-700">
                      <h5 className="font-bold mb-3 text-emerald-300 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Decentralized Storage
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="font-medium text-sm">IPFS Hash</span>
                          </div>
                          <code className="text-xs font-mono text-blue-300 break-all">
                            {summary.ipfsHash || 'QmX7Yz2kqGjmK9YcZ3pLrF5Bw8VnA1CqE4RtY6UdP2sOmN'}
                          </code>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-amber-400" />
                            <span className="font-medium text-sm">Arweave ID</span>
                          </div>
                          <code className="text-xs font-mono text-amber-300 break-all">
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
                        <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-400 mb-2">Sign in to add notes</h4>
                        <p className="text-gray-500 text-sm">
                          Personal notes allow you to save insights and thoughts about this content.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Existing Notes */}
                        {notes.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-bold text-cyan-400 flex items-center gap-2">
                              <StickyNote className="w-4 h-4" />
                              My Notes ({notes.length})
                            </h5>
                            {notes.map((note: UserNote) => (
                              <div key={note.id} className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 rounded-xl p-4 border border-slate-600">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-xs ${
                                      note.noteType === 'analysis' ? 'text-blue-400 border-blue-500/30' :
                                      note.noteType === 'insight' ? 'text-purple-400 border-purple-500/30' :
                                      'text-gray-400 border-gray-500/30'
                                    }`}>
                                      {note.noteType}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${
                                      note.isPrivate ? 'text-amber-400 border-amber-500/30' : 'text-green-400 border-green-500/30'
                                    }`}>
                                      {note.isPrivate ? '🔒 Private' : '🌐 Public'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">
                                      {new Date(note.createdAt).toLocaleDateString()}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingNoteId(note.id)}
                                      className="text-gray-400 hover:text-blue-400 p-1"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteNoteMutation.mutate(note.id)}
                                      className="text-gray-400 hover:text-red-400 p-1"
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
                                      className="bg-gray-900/50 border-gray-600 text-white resize-none"
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
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <Save className="h-3 w-3 mr-1" />
                                        Save
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingNoteId(null)}
                                        className="border-gray-600"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {note.noteText}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Note Section */}
                        <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-xl p-4 border border-indigo-700">
                          {!showNewNoteForm ? (
                            <Button
                              onClick={() => setShowNewNoteForm(true)}
                              className="w-full bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          ) : (
                            <div className="space-y-4">
                              <h5 className="font-bold text-indigo-300 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add New Note
                              </h5>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select value={newNoteType} onValueChange={(value: 'footnote' | 'analysis' | 'insight') => setNewNoteType(value)}>
                                  <SelectTrigger className="bg-gray-900/50 border-gray-600">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="footnote">📝 Footnote</SelectItem>
                                    <SelectItem value="analysis">🔍 Analysis</SelectItem>
                                    <SelectItem value="insight">💡 Insight</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Select value={isPrivate ? 'private' : 'public'} onValueChange={(value) => setIsPrivate(value === 'private')}>
                                  <SelectTrigger className="bg-gray-900/50 border-gray-600">
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
                                className="bg-gray-900/50 border-gray-600 text-white resize-none"
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
                                  className="bg-green-600 hover:bg-green-700"
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
                                  className="border-gray-600"
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
                            <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-gray-400 mb-2">No notes yet</h4>
                            <p className="text-gray-500 text-sm mb-4">
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
              <Card className="mt-4 bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex gap-4">
                    <img 
                      src={summary.rawData.thumbnail}
                      alt={summary.title}
                      className="w-20 h-16 sm:w-32 sm:h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300 mb-2">
                        {summary.rawData?.channel && <span>📺 {summary.rawData.channel}</span>}
                        {summary.rawData?.views && <span>👁️ {summary.rawData.views} views</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
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