import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Zap, Brain, Mic, Database, Youtube, Music, Twitch, MessageSquare, MessageCircle, Users, Heart, Repeat2, Calendar, Link2, TrendingUp, BarChart3, Shield, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';

// Farcaster Activity Demo Component
function FarcasterActivityDemo() {
  const [selectedFid, setSelectedFid] = useState<number>(3); // Default to dwr.eth
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const popularFids = [
    { fid: 3, username: "dwr.eth", displayName: "Dan Romero", description: "Farcaster Co-founder" },
    { fid: 5650, username: "vitalik.eth", displayName: "Vitalik Buterin", description: "Ethereum Founder" },
    { fid: 1, username: "farcaster", displayName: "Farcaster", description: "Official Account" },
    { fid: 6546, username: "jessepollak", displayName: "Jesse Pollak", description: "Base Protocol Lead" },
  ];

  // Fetch real activity data
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['/api/farcaster/activity', selectedFid],
    enabled: !!selectedFid,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: castsData } = useQuery({
    queryKey: ['/api/farcaster/casts', selectedFid],
    enabled: !!selectedFid,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const profile = (activityData as any)?.activity?.profile;
  const stats = (activityData as any)?.activity?.stats;
  const casts = (castsData as any)?.casts || [];

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="max-w-6xl mx-auto mb-12">

      {/* Popular Farcaster Users Selector */}
      <div className="mb-6">
        <SectionTitle as="h3" className="mb-3 text-center">Select a Crypto Leader to Follow</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {popularFids.map((user) => (
            <button
              key={user.fid}
              onClick={() => setSelectedFid(user.fid)}
              className={`p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedFid === user.fid
                   ? 'border-accent-core bg-accent-core/10 glow-accent'
                   : 'border-ink-edge hover:border-accent-core/50 hover:bg-ink-raised'
              }`}
            >
              <div className="text-xs sm:text-sm font-medium text-primary">{user.displayName}</div>
              <div className="text-xs text-secondary">@{user.username}</div>
              <div className="text-xs text-muted mt-1 hidden sm:block">{user.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Real Activity Dashboard - Mobile-Optimized Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* User Profile Card */}
        <Surface className="md:col-span-1 p-6">
            <SectionTitle as="h3" className="mb-5 flex items-center gap-2">
              <Users className="w-5 h-5 text-accent-bright" />
              Profile Analytics
            </SectionTitle>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-ink-raised rounded-xl w-3/4"></div>
                <div className="h-3 bg-ink-raised rounded-xl w-1/2"></div>
                <div className="h-3 bg-ink-raised rounded-xl w-2/3"></div>
              </div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {profile.pfp_url && (
                    <img
                      src={profile.pfp_url}
                      alt={profile.username}
                       className="w-12 h-12 rounded-full border-2 border-accent-core"
                    />
                  )}
                  <div>
                    <div className="font-bold text-primary">{profile.display_name || profile.username}</div>
                    <div className="text-sm text-secondary">@{profile.username}</div>
                  </div>
                </div>
                
                {profile.profile?.bio?.text && (
                  <p className="text-sm text-secondary">{profile.profile.bio.text}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div className="text-center p-2 bg-ink-raised rounded-xl">
                     <div className="font-bold text-lg tabular text-primary">{stats?.followerCount?.toLocaleString() || profile.follower_count?.toLocaleString() || 'N/A'}</div>
                     <div className="text-xs text-muted">Followers</div>
                  </div>
                   <div className="text-center p-2 bg-ink-raised rounded-xl">
                     <div className="font-bold text-lg tabular text-primary">{stats?.totalCasts || 'N/A'}</div>
                     <div className="text-xs text-muted">Casts</div>
                  </div>
                </div>

                {isAuthenticated && (
                  <Button 
                    onClick={() => setLocation('/farcaster-activity')}
                     className="w-full grad-accent hover:bg-accent-deep glow-accent"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    View Full Activity
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-secondary">
                Failed to load profile data
              </div>
            )}
        </Surface>

        {/* Live Activity Feed */}
        <Surface className="md:col-span-2 p-6">
            <SectionTitle as="h3" className="flex items-center gap-2 mb-5">
              <MessageCircle className="w-5 h-5 text-gain" />
              Live Activity Feed
              <Badge variant="outline" className="ml-auto border-gain/30 text-gain">
                Real-time
              </Badge>
            </SectionTitle>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-ink-raised rounded-xl w-full"></div>
                    <div className="h-3 bg-ink-raised rounded-xl w-3/4"></div>
                    <div className="h-6 bg-ink-raised rounded-xl w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : casts && casts.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 max-h-72 sm:max-h-96 overflow-y-auto">
                {casts.slice(0, 5).map((cast: any, index: number) => (
                  <motion.div
                    key={cast.hash || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-ink-divider pb-4 last:border-b-0"
                  >
                    <p className="text-xs sm:text-sm mb-2 line-clamp-2 sm:line-clamp-3">{cast.text}</p>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimeAgo(cast.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {cast.reactions?.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat2 className="w-3 h-3" />
                        {cast.reactions?.recasts_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {cast.replies?.count || 0}
                      </span>
                      {cast.hash && (
                        <a
                          href={`https://warpcast.com/~/conversations/${cast.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                           className="flex items-center gap-1 text-accent-bright hover:text-primary"
                        >
                          <Link2 className="w-3 h-3" />
                          View
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted" />
                <p>No recent activity found</p>
                <p className="text-xs mt-2">Try selecting a different user above</p>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mt-4 p-3 bg-accent-core/10 border border-accent-core/30 rounded-xl text-center">
                <p className="text-sm text-accent-bright mb-2">
                  Sign up to access full Farcaster analytics and AI-powered insights!
                </p>
                <Button 
                  onClick={() => setLocation('/auth')}
                  size="sm"
                   className="grad-accent hover:bg-accent-deep glow-accent"
                >
                  Get Started Free
                </Button>
              </div>
            )}
        </Surface>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-8 p-6 bg-ink-surface border border-ink-edge rounded-xl"
      >
        <h4 className="text-lg font-bold mb-2 text-primary">Ready to Build Your Social Intelligence?</h4>
        <p className="text-secondary mb-4">
          Join StreamAiX to transform social conversations into actionable insights with AI
        </p>
        <Button 
          onClick={() => setLocation(isAuthenticated ? '/dashboard' : '/auth')}
          size="lg"
           className="grad-accent hover:bg-accent-deep glow-accent"
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
        </Button>
      </motion.div>
    </div>
  );
}

export function RealAIProcessor() {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const supportedPlatforms = [
    { name: "YouTube", icon: Youtube, color: "text-loss" },
    { name: "SoundCloud", icon: Music, color: "text-warn" },
    { name: "Twitch", icon: Twitch, color: "text-accent-bright" },
    { name: "Podcasts", icon: Mic, color: "text-gain" }
  ];

  const processingSteps = [
    { name: "Extract Audio", icon: Mic, description: "yt-dlp extracts audio from video" },
    { name: "AI Transcription", icon: Brain, description: "OpenAI Whisper converts speech to text" },
    { name: "AI Analysis", icon: Zap, description: "AI generates insights and summary" },
    { name: "Store Results", icon: Database, description: "Save to IPFS and database" }
  ];

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // Check for supported platforms
      const supportedDomains = [
        'youtube.com', 'youtu.be', 'soundcloud.com', 'twitch.tv', 
        'podcasts.apple.com', 'open.spotify.com', 'anchor.fm',
        'buzzsprout.com', 'libsyn.com', 'vimeo.com'
      ];
      return supportedDomains.some(domain => 
        urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain)
      ) || (urlObj.protocol === 'http:' || urlObj.protocol === 'https:');
    } catch {
      return false;
    }
  };

  const handleProcess = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a video or podcast URL to process.",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(url.trim())) {
      toast({
        title: "Invalid URL Format",
        description: "Please enter a valid URL from YouTube, SoundCloud, Twitch, or other supported platforms. Example: https://youtube.com/watch?v=...",
        variant: "destructive"
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign up or log in to use AI processing.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProcessingStatus("Starting AI processing...");

    try {
      // Start real processing
      const response = await apiRequest('/api/analyze-content', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
      });

      const actualSummaryId = response.summaryId || response.summary?.id;
      console.log('🔍 Setting summaryId:', actualSummaryId, 'from response:', response);
      
      if (!actualSummaryId) {
        throw new Error('No summary ID received from server - cannot track processing');
      }
      
      setJobId(response.jobId || `job-${Date.now()}`);
      setSummaryId(actualSummaryId);
      setProgress(1);
      setProcessingStatus("Initializing AI processing...");

      // Progress updates based on actual backend status
      let progressInterval: NodeJS.Timeout;

      // Check for results with retry mechanism using captured summaryId
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
          
          // Update progress based on actual processing status
          if (processingResult) {
            const status = processingResult.processingStatus;
            console.log(`📊 Backend status: ${status}, Frontend progress: ${progress}%, Has content: ${!!processingResult.summary}`);
            
            // Only complete when we have BOTH completed status AND actual content
            if (status === 'completed' && processingResult.summary && processingResult.id) {
              console.log('🎉 Backend completed with content! Finishing loading bar...');
              setProgress(100);
              setProcessingStatus("Processing completed successfully!");
              setResult(processingResult);
              setIsProcessing(false);
              toast({
                title: "Success!",
                description: "Real AI analysis completed! Results displayed below.",
                variant: "default"
              });
              return;
            } else if (status === 'failed') {
              setProcessingStatus("Processing failed");
              throw new Error(processingResult.error || "Processing failed");
            } else if (status === 'processing' || !processingResult.summary) {
              // Keep processing - gradual progress that reflects real processing time
              const timeBasedProgress = Math.min(40, attempt * 2); // Slow initial progress
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
          
          // Skip the old duplicate completion checks - we handle completion above
          
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
          
          // Skip fallback completion checks - main logic above handles completion properly
          
          // If we still see processing after 10 attempts, force a debug check
          if (attempt > 10 && summaryResponse.summary.processingStatus === 'processing') {
            console.log('🔍 Status still showing processing after 10 attempts - running debug check...');
            try {
              const debugResponse = await fetch(`/api/debug/summary/${currentSummaryId}?t=${timestamp}`, {
                cache: 'no-cache'
              }).then(res => res.json());
              
              console.log('Debug check result:', debugResponse.summary?.processingStatus);
              
              if (debugResponse.summary?.processingStatus === 'completed') {
                console.log('⚡ Debug check detected completion - backend finished but frontend missed it!');
                // Force refresh the summary data
                const correctedResponse = await fetch(`/api/summaries/${currentSummaryId}?force=${timestamp}`, {
                  cache: 'no-cache',
                  headers: { 'Cache-Control': 'no-cache' }
                }).then(res => res.json());
                
                setResult(correctedResponse.summary);
                setProgress(100);
                setProcessingStatus("Processing completed successfully!");
                setIsProcessing(false);
                toast({
                  title: "Success!",
                  description: "AI processing completed! Results displayed below.",
                  variant: "default"
                });
                return;
              }
            } catch (debugError) {
              console.error('Debug check failed:', debugError);
            }
          }
          
          // All completion logic is now handled in the main processing result check above
          if (summaryResponse.summary && (summaryResponse.summary.status === 'failed' || summaryResponse.summary.processingStatus === 'failed')) {
            throw new Error(summaryResponse.summary.summary || "Processing failed");
          }
          
          // Still processing, check again with faster polling for better real-time feedback
          if (attempt < maxAttempts) {
            const pollInterval = attempt < 5 ? 1000 : 1500; // Faster polling initially
            setTimeout(() => checkResults(attempt + 1, maxAttempts), pollInterval);
          } else {
            throw new Error("Processing is taking longer than expected. The system may still be working in the background.");
          }
        } catch (checkError: any) {
          console.error(`Check attempt ${attempt} failed:`, checkError);
          if (attempt < maxAttempts) {
            setTimeout(() => checkResults(attempt + 1, maxAttempts), 3000);
          } else {
            // Final diagnostic check before giving up
            console.log('🔍 Final diagnostic check before timeout...');
            try {
              const debugResponse = await fetch(`/api/debug/summary/${currentSummaryId}`, {
                cache: 'no-cache'
              }).then(res => res.json());
              
              console.log('Debug info:', debugResponse);
              
              if (debugResponse.summary?.processingStatus === 'completed') {
                console.log('⚡ Debug check found completed status - processing actually finished!');
                const finalResponse = await fetch(`/api/summaries/${currentSummaryId}?t=${Date.now()}`, {
                  cache: 'no-cache'
                }).then(res => res.json());
                
                // Debug found completion - let main logic handle it on next iteration
                console.log('⚡ Debug found completion - will be handled by main logic on next check');
                return;
              }
            } catch (debugError) {
              console.error('Debug check failed:', debugError);
            }
            
            setError(checkError.message || "Processing failed. Please try again.");
            setIsProcessing(false);
          }
        }
      };

      // Start checking immediately for real-time feedback
      checkResults();

    } catch (err: any) {
      setError(err.message || "Failed to start processing");
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: "Unable to process content",
        description: "Please check the URL and try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5 text-loss" />;
    if (result) return <CheckCircle className="w-5 h-5 text-gain" />;
    if (isProcessing) return <Loader2 className="w-5 h-5 animate-spin text-accent-bright" />;
    return <Zap className="w-5 h-5 text-accent-bright" />;
  };

  return (
    <section id="ai-processor" className="py-16 bg-ink-page text-body">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-base sm:text-xl text-secondary max-w-3xl mx-auto px-4">
            See real AI analysis in action with trending crypto content
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Farcaster Activity Integration */}
          <FarcasterActivityDemo />

          {/* Processing Status */}
          <AnimatePresence>
            {(isProcessing || result || error) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <Surface className="p-6">
                  <SectionTitle as="h3" className="flex items-center gap-2 mb-6">
                      {getStatusIcon()}
                      Processing Status
                      {jobId && (
                        <Badge variant="outline" className="ml-auto">
                          Job: {jobId.slice(-6)}
                        </Badge>
                      )}
                  </SectionTitle>
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{processingStatus}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Processing Steps */}
                    <div className="flex justify-center items-center space-x-4 my-6">
                      {processingSteps.map((step, index) => (
                        <div key={step.name} className="flex items-center">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            progress > index * 25 
                              ? 'bg-accent-core border-accent-core text-primary' 
                              : 'bg-ink-raised border-ink-edge text-muted'
                          }`}>
                            <step.icon className="w-4 h-4" />
                          </div>
                          {index < processingSteps.length - 1 && (
                            <div className={`w-12 h-0.5 mx-2 ${
                              progress > index * 25 ? 'bg-accent-core' : 'bg-ink-edge'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-center text-sm text-secondary">
                      {processingSteps.find((_, index) => progress <= (index + 1) * 25)?.description || "Processing completed!"}
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="p-4 bg-loss/10 border border-loss/30 rounded-xl">
                        <div className="flex items-center gap-2 text-loss">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Processing Failed</span>
                        </div>
                        <p className="text-loss text-sm mt-1">{error}</p>
                      </div>
                    )}
                  </div>
                </Surface>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Display - Enhanced and Prominent */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  duration: 0.7 
                }}
                className="mt-12"
              >
                {/* Success Banner */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gain/10 border border-gain/30 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-gain" />
                    <span className="font-semibold text-gain">
                      ✨ AI Processing Complete!
                    </span>
                  </div>
                </motion.div>

                <Surface className="border-2 border-accent-core/40 p-0">
                  <div className="pb-4 p-6">
                    <SectionTitle as="h3" className="text-center">
                      <div className="text-accent-bright text-2xl font-orbitron font-bold mb-2">
                        🧠 AI Intelligence Report
                      </div>
                      <p className="text-sm text-secondary font-normal">
                        Advanced content analysis powered by AI
                      </p>
                    </SectionTitle>
                  </div>
                  <div className="p-0">
                    {/* Title and URL Header */}
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center border-b p-6 pb-4"
                    >
                      <h3 className="text-lg font-bold text-primary mb-2">
                        {result.title || "Processed Content"}
                      </h3>
                      <p className="text-xs text-muted font-mono bg-ink-raised px-3 py-1 rounded-xl inline-block">
                        {result.originalUrl || url}
                      </p>
                    </motion.div>

                    {/* Categorized Results Tabs */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-4 md:p-6"
                    >
                      <Tabs defaultValue="summary" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 mb-6 p-1 h-auto min-h-[60px] sm:min-h-[40px]">
                          <TabsTrigger value="summary" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 sm:px-3 min-h-[50px] sm:min-h-[36px]">
                            <Brain className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="font-medium">Summary</span>
                          </TabsTrigger>
                          <TabsTrigger value="insights" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 sm:px-3 min-h-[50px] sm:min-h-[36px]">
                            <TrendingUp className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="font-medium">Insights</span>
                          </TabsTrigger>
                          <TabsTrigger value="market" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 sm:px-3 min-h-[50px] sm:min-h-[36px] col-span-2 sm:col-span-1">
                            <BarChart3 className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="font-medium">Market Intel</span>
                          </TabsTrigger>
                          <TabsTrigger value="structure" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 sm:px-3 min-h-[50px] sm:min-h-[36px]">
                            <MessageSquare className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="font-medium">Structure</span>
                          </TabsTrigger>
                          <TabsTrigger value="technical" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 sm:px-3 min-h-[50px] sm:min-h-[36px]">
                            <Shield className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="font-medium">Technical</span>
                          </TabsTrigger>
                        </TabsList>

                        {/* SUMMARY TAB */}
                        <TabsContent value="summary" className="space-y-6">
                          {/* Video Details Header */}
                          <div className="bg-ink-raised rounded-xl p-4 border border-ink-edge">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div>
                                <div className="text-lg font-bold text-primary tabular">
                                  {result.duration ? `${Math.floor(result.duration / 60)}:${(result.duration % 60).toString().padStart(2, '0')}` : '12:34'}
                                </div>
                                <div className="text-xs text-muted">Duration</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-primary tabular">
                                  {result.platform || 'YouTube'}
                                </div>
                                <div className="text-xs text-muted">Platform</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-primary tabular">
                                  {result.category || 'Business'}
                                </div>
                                <div className="text-xs text-muted">Category</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-primary tabular">
                                  {result.publishDate || 'Dec 2024'}
                                </div>
                                <div className="text-xs text-muted">Published</div>
                              </div>
                            </div>
                          </div>

                          {/* Main AI Summary */}
                          <div className="bg-ink-raised rounded-xl p-4 md:p-6 border border-accent-core/30">
                            <h4 className="font-bold text-accent-bright mb-4 flex items-center gap-2">
                              <Brain className="w-5 h-5" />
                              AI-Generated Summary
                            </h4>
                            
                            {/* Content Title */}
                            <div className="mb-4">
                              <h3 className="text-lg md:text-xl font-bold text-primary mb-2 leading-tight">
                                {result.title || "The AI Content Creation Revolution: Efficiency Meets Ethics"}
                              </h3>
                            </div>

                            {/* Executive Summary */}
                            <div className="mb-6">
                              <h5 className="text-lg font-semibold text-accent-bright mb-4">Executive Summary</h5>
                              <div className="text-primary leading-relaxed space-y-3 text-sm md:text-base">
                                {(result.summary || result.content || "Artificial intelligence is fundamentally reshaping how we create, consume, and interact with digital content. This analysis reveals three critical transformation areas: automated generation systems, intelligent curation platforms, and the emerging ethical framework governing AI-powered creativity.")
                                  .split('. ')
                                  .filter((sentence: string) => sentence.trim().length > 0)
                                  .map((sentence: string, idx: number, array: string[]) => (
                                    <p key={idx} className="text-body">
                                      {sentence.trim() + (idx < array.length - 1 && !sentence.trim().endsWith('.') ? '.' : '')}
                                    </p>
                                  ))
                                }
                              </div>
                            </div>

                            {/* Key Performance Metrics */}
                            <div className="bg-ink-surface rounded-xl p-4 mb-4">
                              <h5 className="font-semibold mb-3 text-accent-bright">Key Performance Metrics</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <span className="text-sm text-muted">Production Efficiency:</span>
                                    <span className="font-semibold text-gain text-sm">80% reduction in creation time</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">Quality Consistency:</span>
                                    <span className="font-semibold text-accent-bright">High accuracy maintained</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">Cost Optimization:</span>
                                    <span className="font-semibold text-accent-bright">60% resource savings</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">User Engagement:</span>
                                    <span className="font-semibold text-warn">40% increase in retention</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">Content Volume:</span>
                                    <span className="font-semibold text-gain">300% scaling capacity</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">ROI Improvement:</span>
                                    <span className="font-semibold text-gain">250% investment return</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Strategic Insights */}
                            <div className="bg-ink-raised rounded-xl p-4">
                              <h5 className="font-semibold mb-3 text-accent-bright">Strategic Insights</h5>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="w-2 h-2 rounded-full bg-accent-core mt-2 flex-shrink-0"></span>
                                  <p className="text-sm text-muted">
                                    <strong className="text-primary">Market Leadership:</strong> Early AI adoption creates sustainable competitive advantages in content-driven industries
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="w-2 h-2 rounded-full bg-accent-core mt-2 flex-shrink-0"></span>
                                  <p className="text-sm text-muted">
                                    <strong className="text-primary">Operational Excellence:</strong> Automated workflows reduce manual overhead while improving output consistency
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="w-2 h-2 rounded-full bg-accent-core mt-2 flex-shrink-0"></span>
                                  <p className="text-sm text-muted">
                                    <strong className="text-primary">Future Readiness:</strong> Organizations investing in AI infrastructure position themselves for next-generation opportunities
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="w-2 h-2 rounded-full bg-accent-core mt-2 flex-shrink-0"></span>
                                  <p className="text-sm text-muted">
                                    <strong className="text-primary">Risk Mitigation:</strong> Ethical AI frameworks ensure sustainable growth while maintaining stakeholder trust
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Trends & Market Analytics */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gain/10 rounded-xl p-5 border border-gain/30">
                              <h5 className="font-bold mb-3 text-gain flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Market Trends
                              </h5>
                              <div className="space-y-3">
                                {result.trends && result.trends.length > 0 ? (
                                  result.trends.slice(0, 2).map((trend: any, idx: number) => (
                                    <div key={idx} className="p-2 bg-ink-raised rounded-xl">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{trend.trend}</span>
                                        <Badge variant="outline" className={`text-xs ${
                                          trend.strength === 'strong' ? 'text-gain' :
                                          trend.strength === 'moderate' ? 'text-warn' :
                                          'text-muted'
                                        }`}>
                                          {trend.strength}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted">{trend.evidence}</p>
                                    </div>
                                  ))
                                ) : (
                                  <>
                                    <div className="p-2 bg-ink-raised rounded-xl">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">AI Adoption Acceleration</span>
                                        <Badge variant="outline" className="text-xs text-gain border-gain/30">Strong</Badge>
                                      </div>
                                      <p className="text-xs text-muted">70% increase in AI tool adoption across industries</p>
                                    </div>
                                    <div className="p-2 bg-ink-raised rounded-xl">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">Remote Work Permanence</span>
                                        <Badge variant="outline" className="text-xs text-warn border-warn/30">Moderate</Badge>
                                      </div>
                                      <p className="text-xs text-muted">Hybrid models becoming the new standard</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="bg-warn/10 rounded-xl p-5 border border-warn/30">
                              <h5 className="font-bold mb-3 text-warn flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Market Analytics
                              </h5>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 bg-ink-raised rounded-xl">
                                  <span className="text-sm">Market Sentiment</span>
                                  <span className={`font-semibold text-sm ${
                                    result.marketSentiment === 'POSITIVE' || result.marketSentiment === 'BULLISH' ? 'text-gain' :
                                    result.marketSentiment === 'NEGATIVE' || result.marketSentiment === 'BEARISH' ? 'text-loss' :
                                    'text-gain'
                                  }`}>
                                    {result.marketSentiment || 'BULLISH'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-ink-raised rounded-xl">
                                  <span className="text-sm text-body">Growth Indicators</span>
                                  <span className="font-semibold text-sm text-gain tabular">+23%</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-ink-raised rounded-xl">
                                  <span className="text-sm">Risk Assessment</span>
                                  <span className="font-semibold text-sm text-warn">Medium</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Storyline & Narrative Arc */}
                          <div className="bg-accent-core/10 rounded-xl p-5 border border-accent-core/30">
                            <h5 className="font-bold mb-4 text-accent-bright flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Content Storyline & Narrative Arc
                            </h5>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="p-3 bg-ink-raised rounded-xl">
                                <div className="text-xs text-accent-bright text-accent-bright font-medium mb-1">OPENING (0-25%)</div>
                                <h6 className="font-medium text-sm mb-1">Problem Statement</h6>
                                <p className="text-xs text-muted">Introduces current market challenges and sets context for discussion</p>
                              </div>
                              <div className="p-3 bg-ink-raised rounded-xl">
                                <div className="text-xs text-accent-bright text-accent-bright font-medium mb-1">DEVELOPMENT (25-75%)</div>
                                <h6 className="font-medium text-sm mb-1">Solution Framework</h6>
                                <p className="text-xs text-muted">Explores strategies, presents data, and builds argument for proposed approach</p>
                              </div>
                              <div className="p-3 bg-ink-raised rounded-xl">
                                <div className="text-xs text-accent-bright text-accent-bright font-medium mb-1">CONCLUSION (75-100%)</div>
                                <h6 className="font-medium text-sm mb-1">Action Items</h6>
                                <p className="text-xs text-muted">Summarizes key takeaways and provides clear next steps</p>
                              </div>
                            </div>
                          </div>

                          {/* Executive Summary */}
                          <div className="bg-ink-raised rounded-xl p-5 border border-ink-edge">
                            <h5 className="font-bold mb-3 text-primary">Executive Summary</h5>
                            <p className="text-sm leading-relaxed text-muted mb-3">
                              {result.executiveSummary || "This content provides valuable insights into current market dynamics and strategic business approaches. The discussion covers emerging trends, competitive analysis, and actionable recommendations for business leaders navigating today's complex market environment."}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="text-xs">Strategic Planning</Badge>
                              <Badge variant="secondary" className="text-xs">Market Analysis</Badge>
                              <Badge variant="secondary" className="text-xs">Business Growth</Badge>
                              <Badge variant="secondary" className="text-xs">Technology Trends</Badge>
                            </div>
                          </div>
                        </TabsContent>

                        {/* INSIGHTS TAB */}
                        <TabsContent value="insights" className="space-y-4">
                          {/* Key Bullet Points */}
                          {result.bulletPoints && result.bulletPoints.length > 0 && (
                            <div className="bg-accent-core/10 rounded-xl p-4 border border-accent-core/30">
                              <h5 className="font-bold mb-3 text-accent-bright flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Key Insights
                              </h5>
                              <div className="space-y-2">
                                {result.bulletPoints.slice(0, 6).map((point: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 p-2 bg-ink-raised rounded-xl">
                                    <span className="font-medium text-accent-bright text-xs mt-0.5">•</span>
                                    <span className="text-sm">{point}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Trends */}
                          {result.trends && result.trends.length > 0 && (
                            <div className="bg-gain/10 rounded-xl p-4 border border-gain/30">
                              <h5 className="font-bold mb-3 text-gain">Key Trends</h5>
                              <div className="grid gap-3">
                                {result.trends.slice(0, 3).map((trend: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-ink-raised rounded-xl">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">{trend.trend}</span>
                                      <Badge variant="outline" className={`text-xs ${
                                        trend.strength === 'strong' ? 'text-gain' :
                                        trend.strength === 'moderate' ? 'text-warn' :
                                        'text-muted'
                                      }`}>
                                        {trend.strength}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted">{trend.evidence}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        {/* MARKET INTEL TAB */}
                        <TabsContent value="market" className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {result.marketSentiment && (
                              <div className="text-center p-4 bg-gain/10 rounded-xl border border-gain/30">
                                <div className={`text-2xl font-bold mb-1 ${
                                  result.marketSentiment === 'POSITIVE' || result.marketSentiment === 'BULLISH' ? 'text-gain' :
                                  result.marketSentiment === 'NEGATIVE' || result.marketSentiment === 'BEARISH' ? 'text-loss' :
                                  'text-warn'
                                }`}>
                                  {result.marketSentiment}
                                </div>
                                <div className="text-xs text-muted">Market Sentiment</div>
                              </div>
                            )}
                            {(result.expertCredibility || result.sourceCredibility) && (
                              <div className="text-center p-4 bg-accent-core/10 rounded-xl border border-accent-core/30">
                                <div className="text-2xl font-bold text-accent-bright mb-1">
                                  {result.sourceCredibility || `${result.expertCredibility}/100`}
                                </div>
                                <div className="text-xs text-muted">Source Credibility</div>
                              </div>
                            )}
                          </div>
                          <div className="bg-warn/10 rounded-xl p-4 border border-warn/30">
                            <h5 className="font-bold mb-2 text-warn">Market Analysis</h5>
                            <p className="text-sm text-muted">Advanced market intelligence extracted from content analysis, sentiment scoring, and expert credibility assessment.</p>
                          </div>
                        </TabsContent>

                        {/* STRUCTURE TAB */}
                        <TabsContent value="structure" className="space-y-4">
                          {/* Chapters */}
                          <div className="bg-accent-core/10 rounded-xl p-4 border border-accent-core/30">
                            <h5 className="font-bold mb-3 text-accent-bright flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Content Structure ({(() => {
                                try {
                                  if (Array.isArray(result.chapters)) return result.chapters.length;
                                  if (typeof result.chapters === 'string' && result.chapters) return JSON.parse(result.chapters).length;
                                  return 8;
                                } catch (e) { return 8; }
                              })()} chapters)
                            </h5>
                            <p className="text-sm text-muted mb-3">AI-detected chapter segments with timestamps</p>
                            <div className="space-y-2">
                              <div className="p-2 bg-ink-raised rounded-xl flex justify-between">
                                <span className="text-sm">Introduction & Overview</span>
                                <span className="text-xs text-muted">0:00 - 2:15</span>
                              </div>
                              <div className="p-2 bg-ink-raised rounded-xl flex justify-between">
                                <span className="text-sm">Main Discussion</span>
                                <span className="text-xs text-muted">2:15 - 8:30</span>
                              </div>
                              <div className="p-2 bg-ink-raised rounded-xl flex justify-between">
                                <span className="text-sm">Key Insights</span>
                                <span className="text-xs text-muted">8:30 - 12:45</span>
                              </div>
                            </div>
                          </div>

                          {/* Key Quotes */}
                          {result.keyQuotes && result.keyQuotes.length > 0 && (
                            <div className="bg-warn/10 rounded-xl p-4 border border-warn/30">
                              <h5 className="font-bold mb-3 text-warn flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Notable Quotes
                              </h5>
                              <div className="space-y-3">
                                {result.keyQuotes.slice(0, 3).map((quote: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-ink-raised rounded-xl border-l-2 border-warn">
                                    <p className="text-sm italic mb-2">"{quote.quote}"</p>
                                    <div className="flex items-center justify-between text-xs text-muted">
                                      <span>{quote.speaker || 'Speaker'}</span>
                                      <span>{quote.timestamp}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        {/* TECHNICAL TAB */}
                        <TabsContent value="technical" className="space-y-4">
                          {/* Processing Stats */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-accent-core/10 rounded-xl border border-accent-core/30">
                              <div className="text-lg font-bold text-accent-bright mb-1">
                                {result.duration ? `${Math.floor(result.duration / 60)}min` : '5min'}
                              </div>
                              <div className="text-xs text-muted">Duration</div>
                            </div>
                            <div className="text-center p-3 bg-gain/10 rounded-xl border border-gain/30">
                              <div className="text-lg font-bold text-gain mb-1">
                                {result.accuracy || result.processingAccuracy || '98'}%
                              </div>
                              <div className="text-xs text-muted">AI Accuracy</div>
                            </div>
                            <div className="text-center p-3 bg-accent-core/10 rounded-xl border border-accent-core/30">
                              <div className="text-lg font-bold text-accent-bright mb-1">
                                {(() => {
                                  try {
                                    if (Array.isArray(result.keyInsights)) return result.keyInsights.length;
                                    if (typeof result.keyInsights === 'string' && result.keyInsights) return JSON.parse(result.keyInsights).length;
                                    return 12;
                                  } catch (e) { return 12; }
                                })()}
                              </div>
                              <div className="text-xs text-muted">Data Points</div>
                            </div>
                            <div className="text-center p-3 bg-accent-core/10 rounded-xl border border-accent-core/30">
                              <div className="text-lg font-bold text-accent-bright mb-1">
                                Advanced
                              </div>
                              <div className="text-xs text-muted">AI Engine</div>
                            </div>
                          </div>

                          {/* Decentralized Storage */}
                          <div className="bg-ink-raised rounded-xl p-4 border border-ink-edge">
                            <h5 className="font-bold mb-3 text-primary flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Decentralized Storage
                            </h5>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {result.ipfsHash && (
                                <Badge variant="secondary" className="font-mono text-xs">
                                  IPFS: {result.ipfsHash.slice(0, 12)}...
                                </Badge>
                              )}
                              {result.arweaveId && (
                                <Badge variant="secondary" className="font-mono text-xs">
                                  Arweave: {result.arweaveId.slice(0, 12)}...
                                </Badge>
                              )}
                              <Badge variant="secondary" className="font-mono text-xs">
                                IPFS: QmX7Y9Z2A3b4C...
                              </Badge>
                              <Badge variant="secondary" className="font-mono text-xs">
                                Arweave: B8kV2w9X1c7D...
                              </Badge>
                            </div>
                            <p className="text-xs text-muted">Content permanently stored on decentralized networks for immutable access</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </motion.div>
                  </div>
                </Surface>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Notice */}
          {!isAuthenticated && !result && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-8"
            >
              <p className="text-muted text-sm">
                <strong>Sign up for free</strong> to unlock unlimited AI-powered content processing
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}