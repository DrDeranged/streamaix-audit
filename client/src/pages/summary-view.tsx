import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { getAuthHeaders } from '@/lib/auth';
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
  Globe
} from 'lucide-react';

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
}

export default function SummaryView() {
  const [match, params] = useRoute('/summary/:id');
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('analysis');
  const [copySuccess, setCopySuccess] = useState('');

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
    onSuccess: () => {
      toast({ title: 'Shared!', description: 'Content shared successfully.' });
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
                  {summary.accuracy || 95}% Accuracy
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5 px-2"
                onClick={() => shareMutation.mutate('lens')}
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
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
            {/* Summary content */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-transparent border-0 h-auto p-0.5">
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-white/10">
                      Analysis
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="data-[state=active]:bg-white/10">
                      Structure
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="analysis" className="space-y-3 mt-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/20">
                      <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Executive Summary
                      </h3>
                      <div className="text-sm text-gray-300 leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: summary.executiveSummary || summary.summary || 'No summary available' }} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="structure" className="space-y-3 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-5 w-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Content Structure ({summary.chapters?.length || 0} chapters)
                      </h3>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      {summary.chapters && summary.chapters.length > 0 ? (
                        <div className="space-y-4">
                          {summary.chapters.map((chapter: any, index: number) => (
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}