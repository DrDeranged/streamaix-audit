import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useContracts } from '@/hooks/useContracts';
import { useWeb3 } from '@/hooks/useWeb3';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Link as LinkIcon, Video, Headphones, Radio, Plus, X, Sparkles, Shield, CheckCircle2, Brain, ExternalLink } from 'lucide-react';

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
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  useContracts();
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
        title: 'Unable to process content',
        description: 'Please check the URL and try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-ink-page flex items-center justify-center p-4">
        <Surface className="w-full max-w-md p-6 text-center">
            <SectionTitle as="h2" className="mb-4 text-xl">Authentication Required</SectionTitle>
            <p className="text-body mb-4">Please log in to create summaries</p>
            <Button onClick={() => setLocation('/auth')} className="w-full">
              Go to Login
            </Button>
        </Surface>
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
    <div className="min-h-[100dvh] bg-ink-page p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <SectionTitle as="h1" className="mb-4">Create AI Summary</SectionTitle>
          <p className="text-secondary text-lg">
            Transform any podcast, video, or livestream into an insightful summary
          </p>
        </div>

        <Surface className="p-6">
            <SectionTitle as="h2" className="flex items-center gap-2 mb-6">
              <ContentIcon className="h-6 w-6 text-accent-bright" />
              Content Processing
            </SectionTitle>
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                 <Label htmlFor="url" className="text-muted">
                  Content URL *
                </Label>
                <div className="relative">
                   <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-accent-bright" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                     className="pl-10 rounded-xl bg-ink-raised border-ink-edge text-primary placeholder:text-muted focus:border-accent-core"
                    required
                    data-testid="input-content-url"
                  />
                </div>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                 <Label className="text-muted">Content Type *</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value: 'podcast' | 'video' | 'livestream') =>
                    setFormData(prev => ({ ...prev, contentType: value }))
                  }
                >
                   <SelectTrigger className="rounded-xl bg-ink-raised border-ink-edge text-primary" data-testid="select-content-type">
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
                 <Label htmlFor="platform" className="text-muted">
                  Platform *
                </Label>
                <Input
                  id="platform"
                  placeholder="Auto-detected from URL (e.g., YouTube, Spotify)"
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                   className="rounded-xl bg-ink-raised border-ink-edge text-primary placeholder:text-muted focus:border-accent-core"
                  data-testid="input-platform"
                  required
                />
                {formData.url && !formData.platform && (
                   <p className="text-warn text-sm">Platform will be auto-detected when you enter a valid URL</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                 <Label htmlFor="title" className="text-muted">
                  Custom Title
                </Label>
                <Input
                  id="title"
                  placeholder="Leave blank to auto-extract from content"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                   className="rounded-xl bg-ink-raised border-ink-edge text-primary placeholder:text-muted focus:border-accent-core"
                  data-testid="input-custom-title"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                 <Label className="text-muted">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                     className="flex-1 rounded-xl bg-ink-raised border-ink-edge text-primary placeholder:text-muted focus:border-accent-core"
                    data-testid="input-add-tag"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    size="sm"
                    variant="outline"
                     className="rounded-xl border-ink-edge text-accent-bright hover:bg-ink-raised bg-ink-surface"
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
                         className="rounded-xl bg-accent-core/20 text-accent-bright border-accent-core/40"
                        data-testid={`tag-${tag}`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                           className="ml-1 hover:text-primary"
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
                 <Label className="text-muted">Visibility</Label>
                <Select
                  value={formData.isPublic ? 'public' : 'private'}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, isPublic: value === 'public' }))
                  }
                >
                   <SelectTrigger className="rounded-xl bg-ink-raised border-ink-edge text-primary" data-testid="select-visibility">
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
                 <Surface variant="raised" className="space-y-4 p-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Shield className="h-5 w-5 text-accent-bright" />
                     <Label className="text-accent-bright font-semibold">Web3 Options</Label>
                   </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="mint-nft"
                      checked={mintAsNFT}
                      onCheckedChange={(checked) => setMintAsNFT(checked as boolean)}
                       className="border-ink-edge data-[state=checked]:bg-accent-core data-[state=checked]:border-accent-core"
                    />
                    <div className="flex-1">
                       <label htmlFor="mint-nft" className="text-primary font-medium flex items-center gap-2 cursor-pointer">
                         <Sparkles className="h-4 w-4 text-accent-bright" />
                        Mint as NFT
                      </label>
                       <p className="text-secondary text-sm">
                         Create an NFT of your summary stored on IPFS & Arweave
                       </p>
                    </div>
                  </div>

                  {mintAsNFT && (
                     <div className="mt-3 p-3 bg-ink-surface rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                         <Sparkles className="h-4 w-4 text-warn" />
                         <span className="text-warn text-sm font-medium">NFT Features Enabled</span>
                       </div>
                       <ul className="text-body text-sm space-y-1">
                        <li>• Permanent storage on IPFS and Arweave</li>
                        <li>• Ownership proof on blockchain</li>
                        <li>• Tradeable on NFT marketplaces</li>
                        <li>• Metadata with AI processing details</li>
                      </ul>
                    </div>
                  )}
                 </Surface>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                 className="w-full rounded-xl grad-accent glow-accent border border-accent-core text-white font-semibold py-3"
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
                    <Surface className="mb-6 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-accent-core/20 flex items-center justify-center">
                                <Brain className="h-5 w-5 text-accent-bright animate-pulse" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-primary">AI Processing Active</h3>
                              <p className="text-sm text-body font-medium">{processingStatus || "Starting AI analysis..."}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="font-mono bg-accent-core/20 text-accent-bright border-accent-core/40">
                            {Math.round(progress)}%
                          </Badge>
                        </div>
                        <div className="w-full bg-ink-raised rounded-xl h-2">
                          <div 
                            className="bg-accent-core h-2 rounded-xl transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                    </Surface>
                  )}

                  {/* Completion State */}
                  {isCompleted && result && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Surface className="mb-6 p-6">
                          <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-2">
                              <Badge className="bg-gain/20 text-gain border-gain/40">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Analysis Complete
                              </Badge>
                            </div>
                            
                            <h3 className="text-xl font-semibold text-primary">{result.title || "Content Analysis Ready"}</h3>
                            
                            {/* View Results Button */}
                            <Button 
                              onClick={() => {
                                if (result?.id) {
                                  setLocation(`/processing-results/${result.id}`);
                                }
                              }}
                              className="w-full max-w-md grad-accent glow-accent text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                              data-testid="button-view-analysis"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Full Analysis
                            </Button>
                            
                            {showCompletionNotification && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gain/10 border border-gain/30 rounded-xl p-4 text-center"
                              >
                                <div className="flex items-center justify-center gap-2 text-gain">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="font-medium">Your content has been successfully processed!</span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                      </Surface>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-loss/10 border border-loss/30 rounded-xl">
                <h3 className="text-loss font-medium mb-2">Processing Error</h3>
                <p className="text-loss text-sm">{error}</p>
              </div>
            )}

            {/* Info */}
            {!isProcessing && !result && (
              <div className="mt-6 p-4 bg-accent-core/10 border border-accent-core/30 rounded-xl">
                <h3 className="text-accent-bright font-medium mb-2">What happens next?</h3>
                <ul className="text-body text-sm space-y-1">
                  <li>• AI extracts and transcribes the content</li>
                  <li>• Generate comprehensive summary and key insights</li>
                  <li>• Create chapter breakdowns and timestamps</li>
                  <li>• Store on decentralized networks (IPFS/Arweave)</li>
                  <li>• Earn STREAM points for quality content</li>
                </ul>
              </div>
            )}
          </div>
        </Surface>

      </div>
    </div>
  );
}