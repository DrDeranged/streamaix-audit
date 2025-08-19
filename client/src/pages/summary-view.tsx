import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Globe
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
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['summary', summaryId],
    queryFn: () => apiRequest(`/api/summaries/${summaryId}`, {
      headers: getAuthHeaders()
    }),
    enabled: !!summaryId,
  }) as { data: Summary | undefined, isLoading: boolean, error: any };

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
          <p className="text-white text-lg">Loading summary...</p>
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
            <h2 className="text-xl font-semibold text-white mb-2">Summary Not Found</h2>
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

  const isOwner = user?.id === summary.creator.id;
  const canView = summary.isPublic || isOwner;

  if (!canView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <Card className="max-w-md bg-white/10 border-white/20 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Private Summary</h2>
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
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
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
                <h1 className="text-3xl font-bold text-white mb-2" data-testid="summary-title">
                  {summary.title}
                </h1>
                {summary.description && (
                  <p className="text-gray-300 mb-4">{summary.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {summary.creator.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(summary.createdAt).toLocaleDateString()}
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
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Original
                  </Button>
                </a>
                {isAuthenticated && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => likeMutation.mutate()}
                      disabled={likeMutation.isPending}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-white/20 text-white hover:bg-white/10"
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
                  <h3 className="text-white font-semibold">Processing in Progress</h3>
                  <p className="text-gray-300 text-sm">AI is analyzing and summarizing your content</p>
                </div>
              </div>
              <Progress value={jobData.job.progress} className="mb-2" />
              <p className="text-sm text-gray-400">{jobData.job.progress}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Content */}
        {summary.processingStatus === 'completed' && summary.summary && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg mb-6">
            <CardHeader>
              <CardTitle className="text-white">AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-200 leading-relaxed whitespace-pre-line" data-testid="summary-content">
                  {summary.summary}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Insights */}
        {summary.keyInsights && summary.keyInsights.length > 0 && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg mb-6">
            <CardHeader>
              <CardTitle className="text-white">Key Insights</CardTitle>
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
              <CardTitle className="text-white">Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.chapters.map((chapter, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">{chapter.title}</h3>
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
            <CardTitle className="text-white">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Content Type</p>
                <p className="text-white">{summary.contentType}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Platform</p>
                <p className="text-white">{summary.platform}</p>
              </div>
              {summary.originalDuration && (
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white">{Math.round(summary.originalDuration / 60)} minutes</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-sm">Visibility</p>
                <p className="text-white">{summary.isPublic ? 'Public' : 'Private'}</p>
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