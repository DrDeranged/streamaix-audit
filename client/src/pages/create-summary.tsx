import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useContracts } from '@/hooks/useContracts';
import { useWeb3 } from '@/hooks/useWeb3';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Link as LinkIcon, Video, Headphones, Radio, Plus, X, Sparkles, Shield, CheckCircle2, Target, Brain, ExternalLink, BarChart3, Tag as TagIcon, Bell } from 'lucide-react';

interface ProcessContentRequest {
  url: string;
  contentType: 'podcast' | 'video' | 'livestream';
  platform: string;
  title?: string;
  isPublic?: boolean;
  tags?: string[];
}

export default function CreateSummary() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mintSummaryNFT, isLoading: isMintingNFT } = useContracts();
  const { isConnected } = useWeb3();

  const [formData, setFormData] = useState<ProcessContentRequest>({
    url: '',
    contentType: 'video',
    platform: '',
    title: '',
    isPublic: true,
    tags: []
  });

  const [currentTag, setCurrentTag] = useState('');
  const [mintAsNFT, setMintAsNFT] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionNotification, setShowCompletionNotification] = useState(false);

  // Check for pending URL from landing page
  useEffect(() => {
    const pendingUrl = sessionStorage.getItem('pendingUrl');
    if (pendingUrl) {
      try {
        const detectedPlatform = detectPlatform(pendingUrl);
        setFormData(prev => ({ 
          ...prev, 
          url: pendingUrl,
          platform: detectedPlatform
        }));
      } catch {
        setFormData(prev => ({ 
          ...prev, 
          url: pendingUrl,
          platform: 'Unknown'
        }));
      }
      sessionStorage.removeItem('pendingUrl');
    }
  }, []);


  // Auto-detect platform from URL
  const detectPlatform = (url: string) => {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
    if (hostname.includes('spotify.com')) return 'Spotify';
    if (hostname.includes('soundcloud.com')) return 'SoundCloud';
    if (hostname.includes('twitch.tv')) return 'Twitch';
    if (hostname.includes('apple.com')) return 'Apple Podcasts';
    if (hostname.includes('anchor.fm')) return 'Anchor';
    return 'Other';
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }));
    if (url) {
      try {
        const platform = detectPlatform(url);
        setFormData(prev => ({ ...prev, platform }));
      } catch {
        // Invalid URL, set default platform
        setFormData(prev => ({ ...prev, platform: 'Unknown' }));
      }
    } else {
      // Clear platform when URL is empty
      setFormData(prev => ({ ...prev, platform: '' }));
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create summaries.',
        variant: 'destructive',
      });
      setLocation('/auth');
      return;
    }

    if (!formData.url || !formData.contentType) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both URL and content type.',
        variant: 'destructive',
      });
      return;
    }

    // Start AI processing
    console.log('🎬 Starting form submission - setting isProcessing to true');
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setIsCompleted(false);
    setShowCompletionNotification(false);
    setProcessingStatus("Starting AI processing...");

    try {
      console.log('📡 Making API request to start processing...');
      // Start AI processing
      const response = await apiRequest('/api/analyze-content', {
        method: 'POST',
        body: JSON.stringify({ url: formData.url }),
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ API request successful:', response);

      const actualSummaryId = response.summaryId || response.summary?.id;
      console.log('🔍 Setting summaryId:', actualSummaryId, 'from response:', response);
      setSummaryId(actualSummaryId);
      
      if (!actualSummaryId) {
        throw new Error('No summary ID received from server - cannot track processing');
      }
      
      setProgress(1);
      setProcessingStatus("Initializing AI processing...");

      // Remove fake progress - use real-time updates based on backend status

      // Check for results with real-time progress updates
      const checkResults = async (attempt = 1, maxAttempts = 80) => { // Increased for longer AI processing
        const currentSummaryId = actualSummaryId; // Use the captured ID from closure
        try {
          // Don't continue polling if we're already completed
          if (isCompleted) {
            console.log('🛑 Already completed, stopping polling');
            return;
          }
          
          if (!currentSummaryId) {
            console.error('❌ currentSummaryId is null/undefined, cannot check results');
            throw new Error('Lost track of summary ID - processing cannot continue');
          }
          console.log(`Checking results attempt ${attempt}/${maxAttempts} for summary ${currentSummaryId}`);
          
          // Use Real processor result endpoint for better reliability
          const timestamp = Date.now();
          const processingResult = await fetch(`/api/processing-result/${currentSummaryId}?t=${timestamp}`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache'
          }).then(res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              throw new Error(`Expected JSON, got ${contentType}`);
            }
            return res.text();
          }).then(text => {
            if (!text.trim()) {
              throw new Error('Empty response body');
            }
            try {
              return JSON.parse(text);
            } catch (e: any) {
              console.error('JSON parse error. Response text:', text);
              throw new Error(`JSON parse failed: ${e.message}`);
            }
          });
          
          console.log('🚀 Real Processing Result:', processingResult);
          console.log('🔍 Processing Result Keys:', processingResult ? Object.keys(processingResult) : 'null');
          console.log('🔍 Has summary field:', !!processingResult?.summary);
          console.log('🔍 Has blogPost field:', !!processingResult?.blogPost);
          console.log('🔍 Has executiveSummary field:', !!processingResult?.executiveSummary);
          console.log('🔍 Has content field:', !!processingResult?.content);
          
          // Update progress based on actual processing status
          if (processingResult) {
            const status = processingResult.processingStatus;
            // Only complete when backend explicitly says 'completed' - don't rely on content presence alone
            const hasRealContent = (processingResult.summary && processingResult.summary.length > 100) || 
                                   (processingResult.blogPost && processingResult.blogPost.length > 100) || 
                                   (processingResult.executiveSummary && processingResult.executiveSummary.length > 100);
            console.log(`📊 Backend status: ${status}, Frontend progress: ${progress}%, Has real content: ${!!hasRealContent}`);
            if (status === 'completed' && processingResult.id) {
              console.log('🎉 Backend completed with content! Finishing loading bar...');
              console.log('🎉 Setting final state: progress=100, isCompleted=true, isProcessing=false');
              setProgress(100);
              setProcessingStatus("Analysis complete!");
              setResult(processingResult);
              setIsCompleted(true);
              setIsProcessing(false);  // CRITICAL: Stop all processing UI
              setShowCompletionNotification(true);
              
              // Stop further polling attempts
              console.log('🛑 Completion detected - stopping all further polling');
              
              toast({
                title: '🎉 AI Analysis Complete!',
                description: 'Your content has been successfully processed and analyzed.',
                duration: 5000,
              });
              setTimeout(() => {
                setShowCompletionNotification(false);
              }, 3000);
              return; // Exit immediately to prevent further polling
            } else if (status === 'failed') {
              setProcessingStatus("Processing failed");
              throw new Error(processingResult.error || "Processing failed");
            } else if (status === 'processing' || status === 'analyzing' || status !== 'completed') {
              // Keep processing - gradual progress that reflects real processing time
              const timeBasedProgress = Math.min(50, attempt * 1.5); // More gradual progress
              const currentProgress = Math.min(85, 5 + timeBasedProgress); // Start at 5%, cap at 85%
              setProgress(currentProgress);
              
              // Update status message based on actual processing phase and progress
              if (currentProgress < 20) {
                setProcessingStatus("Extracting audio from video...");
              } else if (currentProgress < 50) {
                setProcessingStatus("AI transcription in progress...");
              } else if (currentProgress < 80) {
                setProcessingStatus("Generating comprehensive analysis...");
              } else {
                setProcessingStatus("Finalizing AI report...");
              }
            }
          }
          
          // Fallback to regular summary endpoint
          const summaryResponse = processingResult && processingResult.id ? 
            { summary: processingResult } :
            await fetch(`/api/summaries/${currentSummaryId}?t=${timestamp}`, {
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-cache'
            }).then(res => res.json());
          
          console.log('🚀 V2 Processing Result:', processingResult);
          console.log('📊 Summary status:', summaryResponse.summary?.processingStatus);
          console.log('📝 Summary has content:', !!summaryResponse.summary?.summary);
          console.log('🎯 Summary title:', summaryResponse.summary?.title);
          
          // Skip old completion checks - main logic above handles completion
          
          // All completion logic is now handled in the main processing result check above
          if (summaryResponse.summary && (summaryResponse.summary.status === 'failed' || summaryResponse.summary.processingStatus === 'failed')) {
            throw new Error(summaryResponse.summary.summary || "Processing failed");
          }
          
          // Still processing, check again with faster polling
          if (attempt < maxAttempts) {
            const retryDelay = attempt < 15 ? 800 : 1500; // Faster polling initially
            setTimeout(() => checkResults(attempt + 1, maxAttempts), retryDelay);
          } else {
            throw new Error("AI processing is taking longer than usual. This can happen with longer videos. Please try refreshing the page in a moment to check if processing completed.");
          }
        } catch (checkError: any) {
          console.error(`Check attempt ${attempt} failed:`, checkError);
          if (attempt < maxAttempts) {
            const errorRetryDelay = attempt < 10 ? 1000 : 2000; // Faster error recovery
            setTimeout(() => checkResults(attempt + 1, maxAttempts), errorRetryDelay);
          } else {
            throw checkError;
          }
        }
      };

      // Start checking for results
      await checkResults();
      
    } catch (error: any) {
      console.error('❌ Processing failed with error:', error);
      console.error('❌ Error details:', error.message, error.stack);
      setError(error.message);
      setIsProcessing(false);
      setProgress(0);
      setProcessingStatus("");
      toast({
        title: 'Processing Failed',
        description: error.message || 'Failed to start content processing.',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-300 mb-4">Please log in to create summaries</p>
            <Button onClick={() => setLocation('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contentTypeIcons = {
    video: Video,
    podcast: Headphones,
    livestream: Radio,
  };

  const ContentIcon = contentTypeIcons[formData.contentType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Create AI Summary
          </h1>
          <p className="text-gray-300 text-lg">
            Transform any podcast, video, or livestream into an insightful summary
          </p>
        </div>

        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text flex items-center gap-2">
              <ContentIcon className="h-6 w-6 text-purple-400" />
              Content Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-purple-300">
                  Content URL *
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                    required
                    data-testid="input-content-url"
                  />
                </div>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label className="text-purple-300">Content Type *</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value: 'podcast' | 'video' | 'livestream') =>
                    setFormData(prev => ({ ...prev, contentType: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-900/50 border-purple-500/30 text-white" data-testid="select-content-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">📹 Video</SelectItem>
                    <SelectItem value="podcast">🎧 Podcast</SelectItem>
                    <SelectItem value="livestream">📻 Livestream</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label htmlFor="platform" className="text-purple-300">
                  Platform *
                </Label>
                <Input
                  id="platform"
                  placeholder="Auto-detected from URL (e.g., YouTube, Spotify)"
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                  data-testid="input-platform"
                  required
                />
                {formData.url && !formData.platform && (
                  <p className="text-amber-400 text-sm">⚠️ Platform will be auto-detected when you enter a valid URL</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-purple-300">
                  Custom Title
                </Label>
                <Input
                  id="title"
                  placeholder="Leave blank to auto-extract from content"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                  data-testid="input-custom-title"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-purple-300">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                    data-testid="input-add-tag"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    size="sm"
                    variant="outline"
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 backdrop-blur-lg bg-purple-500/5"
                    data-testid="button-add-tag"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-purple-500/20 text-purple-200 border-purple-500/30"
                        data-testid={`tag-${tag}`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-white"
                          data-testid={`button-remove-tag-${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Setting */}
              <div className="space-y-2">
                <Label className="text-purple-300">Visibility</Label>
                <Select
                  value={formData.isPublic ? 'public' : 'private'}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, isPublic: value === 'public' }))
                  }
                >
                  <SelectTrigger className="bg-slate-900/50 border-purple-500/30 text-white" data-testid="select-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">🌍 Public - Anyone can view</SelectItem>
                    <SelectItem value="private">🔒 Private - Only you can view</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Web3 Features */}
              {isConnected && (
                <div className="space-y-4 p-4 bg-gradient-to-br from-purple-900/30 via-fuchsia-900/20 to-cyan-900/30 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    <Label className="text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text font-semibold">Web3 Options</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="mint-nft"
                      checked={mintAsNFT}
                      onCheckedChange={(checked) => setMintAsNFT(checked as boolean)}
                      className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <div className="flex-1">
                      <label htmlFor="mint-nft" className="text-white font-medium flex items-center gap-2 cursor-pointer">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        Mint as NFT
                      </label>
                      <p className="text-gray-400 text-sm">
                        Create an NFT of your summary stored on IPFS & Arweave
                      </p>
                    </div>
                  </div>

                  {mintAsNFT && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm font-medium">NFT Features Enabled</span>
                      </div>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Permanent storage on IPFS and Arweave</li>
                        <li>• Ownership proof on blockchain</li>
                        <li>• Tradeable on NFT marketplaces</li>
                        <li>• Metadata with AI processing details</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 backdrop-blur-lg border border-purple-400/30 text-white font-semibold py-3"
                disabled={isProcessing}
                data-testid="button-start-processing"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {processingStatus}
                  </>
                ) : (
                  'Start AI Processing'
                )}
              </Button>
            </form>

            {/* Processing Status - Landing Page Design */}
            <AnimatePresence>
              {(isProcessing || result) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6"
                >
                  {/* Progress Card - Same design as landing page */}
                  {isProcessing && (
                    <Card className="mb-6 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text">AI Processing Active</h3>
                              <p className="text-sm text-white/90 font-medium">{processingStatus || "Starting AI analysis..."}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="font-mono bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {Math.round(progress)}%
                          </Badge>
                        </div>
                        <div className="w-full bg-slate-800/50 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Completion State */}
                  {isCompleted && result && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="mb-6 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-2">
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Analysis Complete
                              </Badge>
                            </div>
                            
                            <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">{result.title || "Content Analysis Ready"}</h3>
                            
                            {/* View Results Button */}
                            <Button 
                              onClick={() => {
                                if (result?.id) {
                                  setLocation(`/processing-results/${result.id}`);
                                }
                              }}
                              className="w-full max-w-md bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-[1.02] shadow-lg"
                              data-testid="button-view-analysis"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Full Analysis
                            </Button>
                            
                            {showCompletionNotification && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center"
                              >
                                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="font-medium">Your content has been successfully processed!</span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h3 className="text-red-300 font-medium mb-2">Processing Error</h3>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Info */}
            {!isProcessing && !result && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="text-blue-200 font-medium mb-2">What happens next?</h3>
                <ul className="text-blue-100/80 text-sm space-y-1">
                  <li>• AI extracts and transcribes the content</li>
                  <li>• Generate comprehensive summary and key insights</li>
                  <li>• Create chapter breakdowns and timestamps</li>
                  <li>• Store on decentralized networks (IPFS/Arweave)</li>
                  <li>• Earn STREAM tokens for quality content</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}