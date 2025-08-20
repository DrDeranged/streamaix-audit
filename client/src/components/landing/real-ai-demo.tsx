import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Zap, Brain, Mic, Database, Globe, Youtube, Music, Twitch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export function RealAIDemo() {
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

  const supportedPlatforms = [
    { name: "YouTube", icon: Youtube, color: "text-red-500" },
    { name: "SoundCloud", icon: Music, color: "text-orange-500" },
    { name: "Twitch", icon: Twitch, color: "text-purple-500" },
    { name: "Podcasts", icon: Mic, color: "text-green-500" }
  ];

  const processingSteps = [
    { name: "Extract Audio", icon: Mic, description: "yt-dlp extracts audio from video" },
    { name: "AI Transcription", icon: Brain, description: "OpenAI Whisper converts speech to text" },
    { name: "AI Analysis", icon: Zap, description: "GPT-4o generates insights and summary" },
    { name: "Store Results", icon: Database, description: "Save to IPFS and database" }
  ];

  const handleProcess = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a video or podcast URL to process.",
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
      const response = await apiRequest('/api/test-processing', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
      });

      setJobId(response.jobId);
      setSummaryId(response.summary.id);
      setProgress(10);
      setProcessingStatus("Audio extraction in progress...");

      // Simulate progress updates (in real implementation, use Server-Sent Events)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 3000);

      // Check for results
      setTimeout(async () => {
        try {
          const summaryResponse = await apiRequest(`/api/summaries/${response.summary.id}`);
          if (summaryResponse.summary.processingStatus === 'completed') {
            setResult(summaryResponse.summary);
            setProgress(100);
            setProcessingStatus("Processing completed successfully!");
            clearInterval(progressInterval);
            setIsProcessing(false);
          } else if (summaryResponse.summary.processingStatus === 'failed') {
            throw new Error("Processing failed");
          }
        } catch (checkError) {
          setError("Processing failed. Please try again with a different URL.");
          clearInterval(progressInterval);
          setIsProcessing(false);
        }
      }, 15000);

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
    <section id="real-demo" className="py-12 sm:py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Real AI Processing Demo
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Paste any video or podcast URL and watch our AI extract, transcribe, and analyze the content in real-time
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {supportedPlatforms.map((platform) => (
              <div key={platform.name} className="flex items-center gap-2 px-3 py-2 glass-bg glass-border rounded-lg">
                <platform.icon className={`w-4 h-4 ${platform.color}`} />
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Input Section */}
          <Card className="mb-8 glass-bg glass-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Enter Content URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or any podcast/video URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <Button 
                  onClick={handleProcess} 
                  disabled={isProcessing || !url.trim()}
                  className="sm:px-8"
                  data-testid="button-process-ai"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Process with AI
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>Supported:</strong> YouTube, SoundCloud, Twitch VODs, Podcast RSS feeds, Direct audio/video URLs
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          <AnimatePresence>
            {(isProcessing || result || error) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <Card className="glass-bg glass-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon()}
                      Processing Status
                      {jobId && (
                        <Badge variant="outline" className="ml-auto">
                          Job: {jobId.slice(-6)}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {processingSteps.map((step, index) => (
                        <div key={step.name} className={`p-4 rounded-lg border ${
                          progress > index * 25 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <step.icon className={`w-4 h-4 ${progress > index * 25 ? 'text-indigo-500' : 'text-gray-400'}`} />
                            <span className="font-medium text-sm">{step.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      ))}
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Processing Failed</span>
                        </div>
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Display */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="glass-bg glass-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      AI Processing Results
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => window.open(`/summaries/${result.id}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Full
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary Preview */}
                    <div>
                      <h4 className="font-semibold mb-2">AI-Generated Summary</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {result.summary || result.content || "Summary processing completed successfully. View the full results for detailed insights."}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {result.duration ? `${Math.floor(result.duration / 60)}min` : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          {result.accuracy || result.processingAccuracy || 'N/A'}%
                        </div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="font-semibold text-purple-600 dark:text-purple-400">
                          {result.keyInsights?.length || (result.keyInsights && JSON.parse(result.keyInsights).length) || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Key Insights</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {result.chapters?.length || (result.chapters && JSON.parse(result.chapters).length) || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Chapters</div>
                      </div>
                    </div>

                    {/* Decentralized Storage */}
                    {(result.ipfsHash || result.arweaveId) && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Decentralized Storage</h4>
                        <div className="flex flex-wrap gap-2">
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
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Notice */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card className="glass-bg glass-border border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    <span className="font-semibold">Ready to Process Real Content?</span>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Sign up for free to unlock unlimited AI-powered content processing
                  </p>
                  <Button className="bg-indigo-500 hover:bg-indigo-600">
                    Get Started Free
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}