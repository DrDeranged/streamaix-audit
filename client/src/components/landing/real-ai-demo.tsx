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
    <section id="real-demo" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Try It Live
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Paste any video or podcast URL below and watch real AI extract, transcribe, and analyze the content
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {supportedPlatforms.map((platform, index) => (
              <span key={platform.name} className="flex items-center gap-1">
                <platform.icon className={`w-3 h-3 ${platform.color}`} />
                {platform.name}
                {index < supportedPlatforms.length - 1 && <span className="ml-2">•</span>}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://soundcloud.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-base border-muted-foreground/20 focus:border-indigo-500 transition-colors"
                  disabled={isProcessing}
                />
                <Button 
                  onClick={handleProcess} 
                  disabled={isProcessing || !url.trim()}
                  className="h-12 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
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
                      Process Now
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Supports YouTube, SoundCloud, Twitch, podcasts, and direct video URLs
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 text-center font-medium">
                  💡 Enter a valid URL (not descriptive text). Example: https://youtube.com/watch?v=dQw4w9WgXcQ
                </p>
              </div>
            </div>
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
                    <div className="flex justify-center items-center space-x-4 my-6">
                      {processingSteps.map((step, index) => (
                        <div key={step.name} className="flex items-center">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            progress > index * 25 
                              ? 'bg-indigo-500 border-indigo-500 text-white' 
                              : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                          }`}>
                            <step.icon className="w-4 h-4" />
                          </div>
                          {index < processingSteps.length - 1 && (
                            <div className={`w-12 h-0.5 mx-2 ${
                              progress > index * 25 ? 'bg-indigo-500' : 'bg-muted-foreground/20'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {processingSteps.find((_, index) => progress <= (index + 1) * 25)?.description || "Processing completed!"}
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
                          {(() => {
                            try {
                              if (Array.isArray(result.keyInsights)) {
                                return result.keyInsights.length;
                              } else if (typeof result.keyInsights === 'string' && result.keyInsights) {
                                return JSON.parse(result.keyInsights).length;
                              }
                              return 'N/A';
                            } catch (e) {
                              return 'N/A';
                            }
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">Key Insights</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {(() => {
                            try {
                              if (Array.isArray(result.chapters)) {
                                return result.chapters.length;
                              } else if (typeof result.chapters === 'string' && result.chapters) {
                                return JSON.parse(result.chapters).length;
                              }
                              return 'N/A';
                            } catch (e) {
                              return 'N/A';
                            }
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">Chapters</div>
                      </div>
                    </div>

                    {/* Content Intelligence Section */}
                    {(result.trends || result.narratives || result.bulletPoints) && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3 text-indigo-600 dark:text-indigo-400">📊 Content Intelligence</h4>
                        
                        {/* Executive Summary */}
                        {result.executiveSummary && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">Executive Summary</h5>
                            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-md">
                              <p className="text-sm leading-relaxed">{result.executiveSummary}</p>
                            </div>
                          </div>
                        )}

                        {/* Key Bullet Points */}
                        {result.bulletPoints && result.bulletPoints.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">Key Points</h5>
                            <div className="space-y-2">
                              {result.bulletPoints.slice(0, 4).map((point: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-md">
                                  <span className="font-medium text-blue-600 dark:text-blue-400 text-xs mt-0.5">•</span>
                                  <span className="text-sm">{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trends */}
                        {result.trends && result.trends.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">Key Trends</h5>
                            <div className="grid gap-2">
                              {result.trends.slice(0, 2).map((trend: any, idx: number) => (
                                <div key={idx} className="p-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-md">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{trend.trend}</span>
                                    <Badge variant="outline" className={`text-xs ${
                                      trend.strength === 'strong' ? 'text-green-600 dark:text-green-400' :
                                      trend.strength === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' :
                                      'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {trend.strength}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{trend.evidence}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Quotes */}
                        {result.keyQuotes && result.keyQuotes.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">Notable Quotes</h5>
                            <div className="space-y-2">
                              {result.keyQuotes.slice(0, 2).map((quote: any, idx: number) => (
                                <div key={idx} className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-md border-l-2 border-amber-400">
                                  <p className="text-sm italic mb-1">"{quote.quote}"</p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{quote.speaker || 'Speaker'}</span>
                                    <span>{quote.timestamp}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Analysis Metrics */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {result.marketSentiment && (
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className={`font-semibold text-sm ${
                              result.marketSentiment === 'POSITIVE' || result.marketSentiment === 'BULLISH' ? 'text-green-600 dark:text-green-400' :
                              result.marketSentiment === 'NEGATIVE' || result.marketSentiment === 'BEARISH' ? 'text-red-600 dark:text-red-400' :
                              'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {result.marketSentiment}
                            </div>
                            <div className="text-xs text-muted-foreground">Sentiment</div>
                          </div>
                        )}
                        {(result.expertCredibility || result.sourceCredibility) && (
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="font-semibold text-sm text-purple-600 dark:text-purple-400">
                              {result.sourceCredibility || `${result.expertCredibility}/100`}
                            </div>
                            <div className="text-xs text-muted-foreground">Source Rating</div>
                          </div>
                        )}
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
          {!isAuthenticated && !result && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-8"
            >
              <p className="text-muted-foreground text-sm">
                <strong>Sign up for free</strong> to unlock unlimited AI-powered content processing
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}