import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Link as LinkIcon, 
  Play, 
  Upload, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Wallet,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { getAuthHeaders } from '@/lib/auth';

interface ProcessingStatus {
  stage: 'uploading' | 'extracting' | 'transcribing' | 'summarizing' | 'storing' | 'completed' | 'failed';
  progress: number;
  message: string;
}

export default function CreateSummary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    originalUrl: '',
    contentType: 'video',
    platform: 'youtube',
    description: '',
    tags: [] as string[],
    enableRewards: false,
    rewardAmount: 0,
    targetAccuracy: 90,
  });
  
  const [tagInput, setTagInput] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  // Create summary mutation
  const createSummaryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/summaries', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          originalUrl: data.originalUrl,
          contentType: data.contentType,
          platform: data.platform,
          tags: data.tags,
          processingStatus: 'pending',
          accuracy: null,
          rewardEnabled: data.enableRewards,
          rewardAmount: data.rewardAmount,
          targetAccuracy: data.targetAccuracy,
        }),
      });
    },
    onSuccess: (response) => {
      toast({
        title: 'Summary Created',
        description: 'Your content is being processed. You can track progress in your dashboard.',
      });
      
      // Start actual processing using the backend API
      startProcessing(response.summary.id);
      
      queryClient.invalidateQueries({ queryKey: ['user-summaries'] });
      
      // Reset form
      setFormData({
        title: '',
        originalUrl: '',
        contentType: 'video',
        platform: 'youtube',
        description: '',
        tags: [],
        enableRewards: false,
        rewardAmount: 0,
        targetAccuracy: 90,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create summary',
        variant: 'destructive',
      });
    },
  });

  // Start real processing using backend API
  const startProcessing = async (summaryId: string) => {
    try {
      // Start processing on backend
      await apiRequest(`/api/summaries/${summaryId}/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      // Poll for status updates
      pollProcessingStatus(summaryId);
    } catch (error) {
      console.error('Failed to start processing:', error);
      setProcessingStatus({
        stage: 'failed',
        progress: 0,
        message: 'Failed to start processing',
      });
    }
  };

  // Poll processing status from backend
  const pollProcessingStatus = async (summaryId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await apiRequest(`/api/summaries/${summaryId}/status`, {
          headers: getAuthHeaders(),
        });

        if (statusResponse.currentStage) {
          setProcessingStatus(statusResponse.currentStage);
        }

        // Stop polling when completed or failed
        if (!statusResponse.isProcessing) {
          clearInterval(pollInterval);
          queryClient.invalidateQueries({ queryKey: ['user-summaries'] });
          
          // Clear processing status after a delay
          setTimeout(() => setProcessingStatus(null), 3000);
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
        clearInterval(pollInterval);
        setProcessingStatus({
          stage: 'failed',
          progress: 0,
          message: 'Failed to get processing status',
        });
      }
    }, 2000); // Poll every 2 seconds

    // Auto-cleanup after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.originalUrl) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both title and content URL',
        variant: 'destructive',
      });
      return;
    }
    
    createSummaryMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please sign in to create summaries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-4 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">Create AI Summary</h1>
          <p className="text-slate-300 text-sm sm:text-base lg:text-lg">
            Transform long-form content into digestible, ownable knowledge assets
          </p>
        </div>

        {/* Processing Status */}
        {processingStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <Zap className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Processing Your Content</h3>
                    <p className="text-slate-300 text-sm">{processingStatus.message}</p>
                  </div>
                  {processingStatus.stage === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Clock className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <Progress value={processingStatus.progress} className="h-2" />
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                  <span>Progress</span>
                  <span>{processingStatus.progress}%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Content Details
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Provide information about the content you want to summarize
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">
                      Summary Title *
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter a descriptive title for your summary"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  {/* URL */}
                  <div className="space-y-2">
                    <Label htmlFor="url" className="text-white">
                      <LinkIcon className="w-4 h-4 inline mr-2" />
                      Content URL *
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={formData.originalUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, originalUrl: e.target.value }))}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  {/* Content Type & Platform */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="content-type" className="text-white">
                        Content Type
                      </Label>
                      <Select
                        value={formData.contentType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="audio">Audio/Podcast</SelectItem>
                          <SelectItem value="livestream">Livestream</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="platform" className="text-white">
                        Platform
                      </Label>
                      <Select
                        value={formData.platform}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="twitch">Twitch</SelectItem>
                          <SelectItem value="spotify">Spotify</SelectItem>
                          <SelectItem value="twitter">Twitter Spaces</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Provide additional context about this content..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-white">
                      Tags
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="tags"
                        type="text"
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                      <Button type="button" onClick={addTag} variant="outline" className="border-white/20 text-white">
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-white/20 text-white hover:bg-white/30 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    disabled={createSummaryMutation.isPending}
                  >
                    {createSummaryMutation.isPending ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Creating Summary...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Create AI Summary
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info */}
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Creator Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-slate-400 text-sm">Content Creator</p>
                    </div>
                  </div>
                  
                  {user.walletAddress && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Wallet className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300">
                        {user.ensName || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Processing Info */}
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  AI Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Audio extraction & cleanup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>AI-powered transcription</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Intelligent summarization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Decentralized storage</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reward Settings */}
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Monetization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-rewards" className="text-white text-sm">
                      Enable Rewards
                    </Label>
                    <input
                      id="enable-rewards"
                      type="checkbox"
                      checked={formData.enableRewards}
                      onChange={(e) => setFormData(prev => ({ ...prev, enableRewards: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                  
                  {formData.enableRewards && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="reward-amount" className="text-white text-sm">
                          Reward Amount (STREAM)
                        </Label>
                        <Input
                          id="reward-amount"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.rewardAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, rewardAmount: parseFloat(e.target.value) || 0 }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="target-accuracy" className="text-white text-sm">
                          Target Accuracy (%)
                        </Label>
                        <Input
                          id="target-accuracy"
                          type="number"
                          min="70"
                          max="100"
                          value={formData.targetAccuracy}
                          onChange={(e) => setFormData(prev => ({ ...prev, targetAccuracy: parseInt(e.target.value) || 90 }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}