import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { 
  Zap, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Play,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  Brain,
  MessageSquare,
  Home,
  Youtube,
  Music,
  Twitch,
  ArrowLeft,
  Plus
} from 'lucide-react';

export default function CreateSummary() {
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
    { name: "YouTube", icon: Youtube, color: "text-red-500" },
    { name: "SoundCloud", icon: Music, color: "text-orange-500" },
    { name: "Twitch", icon: Twitch, color: "text-purple-500" },
  ];

  // Check for pending URL from landing page
  useEffect(() => {
    const pendingUrl = sessionStorage.getItem('pendingUrl');
    if (pendingUrl) {
      setUrl(pendingUrl);
      sessionStorage.removeItem('pendingUrl');
    }
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  const validateUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
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

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProcessingStatus("Starting AI processing...");

    try {
      // Start real processing (same as demo)
      const response = await apiRequest('/api/test-processing', {
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
      setProgress(10);
      setProcessingStatus("Audio extraction in progress...");

      // Progress updates with better timing (same as demo)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 85) return prev + 15; // Faster initial progress
          if (prev < 95) return prev + 2;  // Slower final progress to avoid getting stuck at 90%
          return prev;
        });
        
        // Update status messages
        setProcessingStatus(prev => {
          if (progress < 30) return "Extracting audio from video...";
          if (progress < 60) return "AI transcription in progress...";
          if (progress < 90) return "Generating comprehensive analysis...";
          return "Finalizing results...";
        });
      }, 2000);

      // Check for results with retry mechanism (same as demo)
      const checkResults = async (attempt = 1, maxAttempts = 20) => {
        const currentSummaryId = actualSummaryId;
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
          
          // Check if we got a direct summary response (RealContentProcessor format)
          if (processingResult && processingResult.id && (processingResult.status === 'completed' || processingResult.processingStatus === 'completed' || processingResult.summary)) {
            console.log('🎉 Real processor completed! Setting result...');
            setResult(processingResult);
            setProgress(100);
            setProcessingStatus("Processing completed successfully!");
            clearInterval(progressInterval);
            setIsProcessing(false);
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
          if (summaryResponse.summary && (summaryResponse.summary.status === 'completed' || summaryResponse.summary.summary)) {
            console.log('🎉 Real processor completed via summary endpoint!');
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
          
          // Continue polling if still processing
          if (attempt < maxAttempts && summaryResponse.summary?.processingStatus === 'processing') {
            setTimeout(() => checkResults(attempt + 1, maxAttempts), 1500);
          } else {
            throw new Error("Processing is taking longer than expected. The system may still be working in the background.");
          }
        } catch (checkError: any) {
          console.error(`Check attempt ${attempt} failed:`, checkError);
          if (attempt < maxAttempts) {
            setTimeout(() => checkResults(attempt + 1, maxAttempts), 3000);
          } else {
            setError(checkError.message || "Processing failed. Please try again.");
            clearInterval(progressInterval);
            setIsProcessing(false);
          }
        }
      };

      // Start checking after 3 seconds to allow processing to begin
      setTimeout(() => checkResults(), 3000);

    } catch (err: any) {
      setError(err.message || "Failed to start processing");
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: "Processing Failed",
        description: err.message || "Failed to process content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (result) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (isProcessing) return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    return <Zap className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
            data-testid="button-back-home"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              AI Content Processor
            </h1>
            <p className="text-gray-300 text-lg">
              Transform any video or podcast into comprehensive AI analysis
            </p>
          </div>
        </div>

        {/* Supported Platforms */}
        <div className="mb-8 text-center">
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-300">
            {supportedPlatforms.map((platform, index) => (
              <span key={platform.name} className="flex items-center gap-1">
                <platform.icon className={`w-4 h-4 ${platform.color}`} />
                {platform.name}
                {index < supportedPlatforms.length - 1 && <span className="ml-2">•</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://soundcloud.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-base bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-500 transition-colors"
                  disabled={isProcessing}
                  data-testid="input-url"
                />
                <Button 
                  onClick={handleProcess} 
                  disabled={isProcessing || !url.trim()}
                  className="h-12 px-8 bg-gradient-to-r from-indigo-500/80 to-purple-600/80 hover:from-indigo-600/90 hover:to-purple-700/90 backdrop-blur-lg border border-white/20"
                  data-testid="button-process-ai"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Process with AI
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-300 text-center">
                  Supports YouTube, SoundCloud, Twitch, podcasts, and direct video URLs
                </p>
                <p className="text-xs text-orange-400 text-center font-medium">
                  💡 Enter a valid URL (not descriptive text). Example: https://youtube.com/watch?v=dQw4w9WgXcQ
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Status */}
        <AnimatePresence>
          {(isProcessing || result || error) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    {getStatusIcon()}
                    Processing Status
                    {jobId && (
                      <Badge variant="outline" className="ml-auto border-white/20 text-white">
                        Job: {jobId.slice(-6)}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isProcessing && (
                    <>
                      <Progress value={progress} className="w-full" />
                      <p className="text-center text-gray-300">{processingStatus}</p>
                    </>
                  )}
                  
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-200 text-center">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section (same as demo) */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Title and Basic Info */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Content Analysis Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{result.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                        {result.platform}
                      </Badge>
                      <Badge className="bg-green-500/20 text-green-200 border-green-500/30">
                        {Math.round(result.accuracy || 95)}% Accuracy
                      </Badge>
                      {result.originalDuration && (
                        <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          {Math.round(result.originalDuration / 60)} min
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Summary */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Brain className="w-5 h-5 text-blue-500" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200">{result.summary || result.tldrSummary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Market Analysis */}
              {result.marketAnalysis && (
                <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Market Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-200">{result.marketAnalysis}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Insights */}
              {result.keyInsights && result.keyInsights.length > 0 && (
                <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Target className="w-5 h-5 text-purple-500" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.keyInsights.map((insight: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-gray-200">{insight.insight || insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setLocation('/dashboard')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
                  data-testid="button-view-dashboard"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setUrl("");
                    setResult(null);
                    setError(null);
                    setProgress(0);
                    setIsProcessing(false);
                  }}
                  className="bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-700/90 hover:to-blue-700/90 backdrop-blur-lg border border-white/20"
                  data-testid="button-process-another"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Process Another
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div className="mt-8 max-w-2xl mx-auto">
          <Card className="bg-blue-500/10 border-blue-500/20 backdrop-blur-lg">
            <CardContent className="p-4">
              <h3 className="text-blue-200 font-medium mb-2">What happens next?</h3>
              <ul className="text-blue-100/80 text-sm space-y-1">
                <li>• AI extracts and transcribes the content</li>
                <li>• Generate comprehensive summary and key insights</li>
                <li>• Create chapter breakdowns and timestamps</li>
                <li>• Store on decentralized networks (IPFS/Arweave)</li>
                <li>• Earn STREAM tokens for quality content</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}