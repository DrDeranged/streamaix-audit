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
import { motion } from 'framer-motion';
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

  // Processing state (same as demo)
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

    // Use same processing as demo
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setIsCompleted(false);
    setShowCompletionNotification(false);
    setProcessingStatus("Starting AI processing...");

    try {
      // Start real processing (same as demo)
      const response = await apiRequest('/api/test-processing', {
        method: 'POST',
        body: JSON.stringify({ url: formData.url }),
        headers: { 'Content-Type': 'application/json' }
      });

      const actualSummaryId = response.summaryId || response.summary?.id;
      console.log('🔍 Setting summaryId:', actualSummaryId, 'from response:', response);
      
      if (!actualSummaryId) {
        throw new Error('No summary ID received from server - cannot track processing');
      }
      
      setProgress(10);
      setProcessingStatus("Audio extraction in progress...");

      // Progress updates with better timing (same as demo)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 85) return prev + 15;
          if (prev < 95) return prev + 2;
          return prev;
        });
        
        setProcessingStatus(prev => {
          if (progress < 30) return "Extracting audio from video...";
          if (progress < 60) return "AI transcription in progress...";
          if (progress < 90) return "Generating comprehensive analysis...";
          return "Finalizing results...";
        });
      }, 2000);

      // Check for results with retry mechanism - EXACT copy from working demo
      const checkResults = async (attempt = 1, maxAttempts = 20) => {
        const currentSummaryId = actualSummaryId; // Use the captured ID from closure
        try {
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
          console.log('🔍 Result Analysis:');
          console.log('- Has ID:', !!processingResult?.id);
          console.log('- Status:', processingResult?.status);
          console.log('- Processing Status:', processingResult?.processingStatus);
          console.log('- Has Summary:', !!processingResult?.summary);
          console.log('- Has Content:', !!processingResult?.content);
          console.log('- Has Title:', !!processingResult?.title);
          console.log('- Full keys:', processingResult ? Object.keys(processingResult) : 'none');
          
          // Check if we got a direct summary response (RealContentProcessor format)
          // The rebuilt processor returns summary data directly at the top level
          if (processingResult && processingResult.id && 
              (processingResult.processingStatus === 'completed' || 
               processingResult.status === 'completed' || 
               processingResult.summary || 
               processingResult.blogPost ||
               processingResult.executiveSummary ||
               processingResult.tldrSummary ||
               processingResult.content)) {
            console.log('🎉 Real processor completed! Setting result...');
            console.log('✅ Detected completion with data:', {
              hasId: !!processingResult.id,
              status: processingResult.status,
              processingStatus: processingResult.processingStatus,
              hasSummary: !!processingResult.summary,
              hasBlogPost: !!processingResult.blogPost,
              hasExecutiveSummary: !!processingResult.executiveSummary
            });
            setResult(processingResult);
            setProgress(100);
            setProcessingStatus("Processing completed successfully!");
            
            // Small delay to ensure UI state is proper
            setTimeout(() => {
              setIsCompleted(true);
              setShowCompletionNotification(true);
              clearInterval(progressInterval);
              setIsProcessing(false);
            }, 500);
            
            // Show completion notification
            toast({
              title: '🎉 AI Analysis Complete!',
              description: 'Your content has been successfully processed and analyzed.',
              duration: 5000,
            });
            
            // Auto-hide notification after 3 seconds
            setTimeout(() => {
              setShowCompletionNotification(false);
            }, 3000);
            toast({
              title: "Success!",
              description: "Real AI analysis completed! Results displayed below.",
              variant: "default"
            });
            return;
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
          
          // REAL PROCESSOR: Check for completion via any endpoint
          if (summaryResponse.summary && (
            summaryResponse.summary.processingStatus === 'completed' ||
            summaryResponse.summary.status === 'completed' || 
            summaryResponse.summary.summary || 
            summaryResponse.summary.blogPost ||
            summaryResponse.summary.executiveSummary ||
            summaryResponse.summary.content ||
            summaryResponse.summary.tldrSummary
          )) {
            console.log('🎉 Real processor completed via summary endpoint!');
            console.log('📊 Summary data keys:', Object.keys(summaryResponse.summary));
            setResult(summaryResponse.summary);
            setProgress(100);
            setProcessingStatus("Processing completed successfully!");
            clearInterval(progressInterval);
            setIsProcessing(false);
            toast({
              title: "Success!",
              description: "Real AI content analysis completed!",
              variant: "default"
            });
            return;
          }
          
          if (summaryResponse.summary && (summaryResponse.summary.status === 'completed' || summaryResponse.summary.processingStatus === 'completed')) {
            console.log('🎉 Processing completed! Setting result...');
            setResult(summaryResponse.summary);
            setProgress(100);
            setProcessingStatus("Processing completed successfully!");
            clearInterval(progressInterval);
            setIsProcessing(false);
            toast({
              title: "Success!",
              description: "Real AI processing completed! Results displayed below.",
              variant: "default"
            });
            return;
          } else if (summaryResponse.summary && (summaryResponse.summary.status === 'failed' || summaryResponse.summary.processingStatus === 'failed')) {
            throw new Error(summaryResponse.summary.summary || "Processing failed");
          }
          
          // Still processing, check again
          if (attempt < maxAttempts) {
            setTimeout(() => checkResults(attempt + 1, maxAttempts), 1500);
          } else {
            throw new Error("Processing is taking longer than expected. The system may still be working in the background.");
          }
        } catch (checkError: any) {
          console.error(`Check attempt ${attempt} failed:`, checkError);
          if (attempt < maxAttempts) {
            setTimeout(() => checkResults(attempt + 1, maxAttempts), 3000);
          } else {
            throw checkError;
          }
        }
      };

      // Start checking for results
      await checkResults();
      
    } catch (error: any) {
      console.error('Processing failed:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Create AI Summary
          </h1>
          <p className="text-gray-300 text-lg">
            Transform any podcast, video, or livestream into an insightful summary
          </p>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ContentIcon className="h-6 w-6" />
              Content Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-white">
                  Content URL *
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                    data-testid="input-content-url"
                  />
                </div>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label className="text-white">Content Type *</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value: 'podcast' | 'video' | 'livestream') =>
                    setFormData(prev => ({ ...prev, contentType: value }))
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-content-type">
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
                <Label htmlFor="platform" className="text-white">
                  Platform *
                </Label>
                <Input
                  id="platform"
                  placeholder="Auto-detected from URL (e.g., YouTube, Spotify)"
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="input-platform"
                  required
                />
                {formData.url && !formData.platform && (
                  <p className="text-amber-400 text-sm">⚠️ Platform will be auto-detected when you enter a valid URL</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Custom Title
                </Label>
                <Input
                  id="title"
                  placeholder="Leave blank to auto-extract from content"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="input-custom-title"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-white">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    data-testid="input-add-tag"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
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
                <Label className="text-white">Visibility</Label>
                <Select
                  value={formData.isPublic ? 'public' : 'private'}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, isPublic: value === 'public' }))
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-visibility">
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
                <div className="space-y-4 p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    <Label className="text-white font-semibold">Web3 Options</Label>
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
                className="w-full bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-700/90 hover:to-blue-700/90 backdrop-blur-lg border border-white/20 text-white font-semibold py-3"
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

            {/* Processing Progress */}
            {isProcessing && (
              <div className="mt-6 p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/40 rounded-lg backdrop-blur-lg shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                  <h3 className="text-xl font-bold text-white">🤖 AI Processing in Progress</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-medium">{processingStatus}</span>
                    <span className="text-purple-300 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700/60 rounded-full h-4 border border-gray-600">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-center text-purple-200 text-sm">
                    Please wait while we analyze your content...
                  </p>
                </div>
              </div>
            )}

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

        {/* Results Display - Glass morphism theme */}
        {result && isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8"
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                  AI Analysis Complete!
                </CardTitle>
                <p className="text-gray-300">
                  {result.title || 'Content processed successfully'}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {/* Title and URL Header */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center border-b p-6 pb-4"
                >
                  <h3 className="text-lg font-bold text-white mb-2">
                    {result.title || "Processed Content"}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono bg-white/10 px-3 py-1 rounded-full inline-block">
                    {formData.url}
                  </p>
                </motion.div>

                {/* Main AI Summary */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-6"
                >
                  <div className="bg-white/5 border-white/10 backdrop-blur-lg rounded-xl p-6 border">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI-Generated Summary
                    </h4>
                    
                    {/* Content Title */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {result.title || "AI Content Analysis"}
                      </h3>
                    </div>

                    {/* Executive Summary */}
                    <div className="mb-6">
                      <h5 className="text-lg font-semibold text-purple-300 mb-3">Executive Summary</h5>
                      <p className="text-gray-200 leading-relaxed">
                        {result.executiveSummary || result.summary || result.blogPost || result.content || "AI analysis completed successfully with comprehensive insights extracted from the provided content."}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4">
                      <Button 
                        className="bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-700/90 hover:to-blue-700/90 backdrop-blur-lg border border-white/20"
                        onClick={() => setLocation(`/processing-results/${result.id}`)}
                        disabled={!isCompleted}
                        data-testid="button-view-full-analysis"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {isCompleted ? 'View Full Analysis' : 'Processing...'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
                        onClick={() => {
                          setResult(null);
                          setFormData({ url: '', contentType: 'video', platform: '', title: '', tags: [], isPublic: true });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Process Another
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      
      {/* Fixed Bottom Loading Bar */}
      {isProcessing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/98 via-purple-900/98 to-slate-900/98 backdrop-blur-xl border-t-2 border-purple-500/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                <span className="text-white text-sm font-medium">{processingStatus}</span>
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-purple-300 text-sm font-medium">{progress}%</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Completion Notification */}
      {showCompletionNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-green-600/90 to-emerald-600/90 backdrop-blur-lg border border-green-500/30 rounded-lg p-4 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <Bell className="h-5 w-5 text-green-300" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Processing Complete!</h4>
              <p className="text-green-100 text-sm">Your AI analysis is ready to view</p>
            </div>
            <button
              onClick={() => setShowCompletionNotification(false)}
              className="ml-2 text-green-200 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}