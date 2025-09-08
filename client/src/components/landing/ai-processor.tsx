import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, CheckCircle, Brain, Zap, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function AIProcessor() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleProcess = async () => {
    if (!url.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a video or podcast URL to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setIsCompleted(false);
    setProcessingStatus("Starting AI processing...");

    try {
      console.log('🎬 Starting AI processing from landing page:', url);
      
      // Start AI processing
      const response = await apiRequest('/api/analyze-content', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
      });

      const actualSummaryId = response.summaryId || response.summary?.id;
      setSummaryId(actualSummaryId);
      
      if (!actualSummaryId) {
        throw new Error('No summary ID received from server');
      }
      
      setProgress(5);
      setProcessingStatus("Extracting content metadata...");

      // Poll for results
      const checkResults = async (attempt = 1, maxAttempts = 60) => {
        try {
          if (isCompleted) return;
          
          const timestamp = Date.now();
          const result = await fetch(`/api/processing-result/${actualSummaryId}?t=${timestamp}`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache'
          }).then(res => res.json());

          console.log(`📊 Landing page polling attempt ${attempt}: ${result?.summary?.processingStatus}`);

          if (result?.summary?.processingStatus === 'completed') {
            setProgress(100);
            setProcessingStatus("Analysis complete!");
            setIsCompleted(true);
            setIsProcessing(false);
            
            toast({
              title: '🎉 AI Analysis Complete!',
              description: 'Your content has been successfully processed. Redirecting to results...',
              duration: 3000,
            });

            // Redirect to results page
            setTimeout(() => {
              setLocation(`/processing-results?id=${actualSummaryId}`);
            }, 2000);
            
          } else if (result?.summary?.processingStatus === 'failed') {
            throw new Error('Processing failed');
          } else {
            // Update progress based on status
            const newProgress = Math.min(progress + 2, 90);
            setProgress(newProgress);
            
            if (newProgress < 30) {
              setProcessingStatus("Analyzing audio content...");
            } else if (newProgress < 60) {
              setProcessingStatus("Generating AI insights...");
            } else {
              setProcessingStatus("Finalizing analysis...");
            }

            // Continue polling
            if (attempt < maxAttempts) {
              setTimeout(() => checkResults(attempt + 1, maxAttempts), 2000);
            } else {
              throw new Error('Processing timeout');
            }
          }
        } catch (error) {
          console.error('❌ Polling error:', error);
          if (attempt < maxAttempts) {
            setTimeout(() => checkResults(attempt + 1, maxAttempts), 3000);
          } else {
            throw error;
          }
        }
      };

      // Start polling
      checkResults();

    } catch (error) {
      console.error('❌ Processing error:', error);
      setIsProcessing(false);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to start AI processing',
        variant: 'destructive',
      });
    }
  };

  return (
    <section id="ai-analysis" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Try AI Analysis Live
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Process any video or podcast URL with real AI transcription and analysis. 
            Powered by <span className="text-indigo-500 font-semibold">OpenAI Whisper & GPT-4o</span>
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <Card className="glass-bg glass-border shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              {!isProcessing && !isCompleted && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      type="url"
                      placeholder="Paste YouTube, podcast, or livestream URL..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 text-base"
                      disabled={isProcessing}
                    />
                    <Button
                      onClick={handleProcess}
                      disabled={!url.trim() || isProcessing}
                      size="lg"
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Process with AI
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">YouTube</Badge>
                    <Badge variant="outline" className="text-xs">SoundCloud</Badge>
                    <Badge variant="outline" className="text-xs">Twitch</Badge>
                    <Badge variant="outline" className="text-xs">Podcasts</Badge>
                    <Badge variant="outline" className="text-xs">Livestreams</Badge>
                  </div>
                </div>
              )}

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
                      <h3 className="text-xl font-semibold">AI Processing in Progress</h3>
                    </div>
                    <p className="text-muted-foreground">{processingStatus}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm">Audio Extraction</span>
                    </div>
                    <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                      {progress > 30 ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mr-2" />
                      )}
                      <span className="text-sm">AI Transcription</span>
                    </div>
                    <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                      {progress > 60 ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <Brain className="w-5 h-5 text-gray-400 mr-2" />
                      )}
                      <span className="text-sm">Summary Generation</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Analysis Complete!
                  </h3>
                  <p className="text-muted-foreground">
                    Your content has been processed successfully. Redirecting to results...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Redirecting in 2 seconds...</span>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="glass-bg glass-border h-full">
                <CardContent className="p-6 text-center">
                  <Brain className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced GPT-4o analysis generates comprehensive summaries and insights
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="glass-bg glass-border h-full">
                <CardContent className="p-6 text-center">
                  <Zap className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Real-Time Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Live status updates and progress tracking during AI analysis
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="glass-bg glass-border h-full">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Comprehensive Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed summaries, key insights, market analysis, and chapter breakdowns
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}