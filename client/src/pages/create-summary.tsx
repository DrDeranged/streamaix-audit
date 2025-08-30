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
import { Loader2, Link as LinkIcon, Video, Headphones, Radio, Plus, X, Sparkles, Shield, Home } from 'lucide-react';

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

  // Process content mutation - FIXED to use same reliable processor as demo
  const processContentMutation = useMutation({
    mutationFn: async (data: ProcessContentRequest) => {
      // Use the same reliable endpoint as the demo for consistent processing
      return apiRequest('/api/test-processing', {
        method: 'POST',
        body: JSON.stringify({ url: data.url }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data: any) => {
      // NFT minting will be available after processing completes
      if (mintAsNFT && isConnected) {
        toast({
          title: 'NFT Minting',
          description: 'NFT minting will be available once processing completes on the results page.',
          variant: 'default',
        });
      }

      toast({
        title: 'AI Processing Started',
        description: 'Your content is being analyzed. You will be redirected to view real-time progress.',
        variant: 'default',
      });
      
      // Use the summary ID to redirect to results page
      const summaryId = data.summaryId || data.summary?.id;
      if (summaryId) {
        queryClient.invalidateQueries({ queryKey: ['summaries'] });
        setLocation(`/results/${summaryId}`);
      } else {
        console.error('No summary ID received:', data);
        toast({
          title: 'Processing Issue',
          description: 'Processing started but unable to track progress. Check your dashboard.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Processing Failed',
        description: error.message || 'Failed to start content processing.',
        variant: 'destructive',
      });
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
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

    // Process with the same reliable processor as demo
    processContentMutation.mutate(formData);
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation('/auth');
    return null;
  }

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
              Create AI Summary
            </h1>
            <p className="text-gray-300 text-lg">
              Transform content into shareable, monetizable AI analysis
            </p>
          </div>
        </div>

        {/* Main Form */}
        <Card className="glass-bg glass-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Content Processing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-white font-medium">
                  Content URL *
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=... or https://soundcloud.com/..."
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="pl-10 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500 transition-colors"
                    required
                    data-testid="input-content-url"
                  />
                </div>
                {formData.platform && (
                  <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                    Platform: {formData.platform}
                  </Badge>
                )}
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label htmlFor="contentType" className="text-white font-medium">
                  Content Type *
                </Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value as any }))}
                >
                  <SelectTrigger className="h-12 bg-white/5 border-white/20 text-white focus:border-purple-500" data-testid="select-content-type">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="video" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video
                      </div>
                    </SelectItem>
                    <SelectItem value="podcast" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Headphones className="h-4 w-4" />
                        Podcast
                      </div>
                    </SelectItem>
                    <SelectItem value="livestream" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4" />
                        Livestream
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white font-medium">
                  Custom Title (Optional)
                </Label>
                <Input
                  id="title"
                  placeholder="Leave blank to use original title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500 transition-colors"
                  data-testid="input-title"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-white font-medium">
                  Tags (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add relevant tags..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 h-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500 transition-colors"
                    data-testid="input-tag"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!currentTag.trim()}
                    className="h-10 px-4 bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-lg"
                    data-testid="button-add-tag"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                        {tag}
                        <Button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 h-auto p-0 bg-transparent hover:bg-transparent text-purple-200 hover:text-white"
                          data-testid={`button-remove-tag-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: !!checked }))}
                    className="border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                    data-testid="checkbox-public"
                  />
                  <Label htmlFor="isPublic" className="text-white font-medium">
                    Make this summary public
                  </Label>
                </div>
                <p className="text-gray-400 text-sm ml-6">
                  Public summaries can be discovered by other users and earn more rewards
                </p>

                {isConnected && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mintAsNFT"
                      checked={mintAsNFT}
                      onCheckedChange={(checked) => setMintAsNFT(!!checked)}
                      className="border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      data-testid="checkbox-mint-nft"
                    />
                    <Label htmlFor="mintAsNFT" className="text-white font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      Mint as NFT (Web3 Ownership)
                    </Label>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={processContentMutation.isPending || !formData.url || !formData.contentType}
                  className="w-full h-12 bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-700/90 hover:to-blue-700/90 backdrop-blur-lg border border-white/20 text-white font-medium"
                  data-testid="button-start-processing"
                >
                  {processContentMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Starting AI Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start AI Processing
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Web3 Minting Status */}
        {mintAsNFT && isConnected && (
          <Card className="glass-bg glass-border mt-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-200">
                <Shield className="h-4 w-4" />
                <span className="text-sm">
                  {isMintingNFT ? 'Minting NFT ownership...' : 'Ready to mint as NFT after processing'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Tips */}
        <Card className="glass-bg glass-border mt-6">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              What Our AI Will Extract
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Complete transcription with timestamps
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Key insights and main topics
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Chapter breakdowns with navigation
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  Market trends and financial insights
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  Strategic business intelligence
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                  Decentralized storage on IPFS/Arweave
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Potential */}
        <Card className="glass-bg glass-border mt-6">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-400" />
              Monetization Potential
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-2xl font-bold text-green-400 mb-1">5-50</div>
                <div className="text-gray-300">STREAM Tokens</div>
                <div className="text-xs text-gray-400 mt-1">Per quality summary</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400 mb-1">10-200</div>
                <div className="text-gray-300">Tips & Shares</div>
                <div className="text-xs text-gray-400 mt-1">Community rewards</div>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-400 mb-1">100+</div>
                <div className="text-gray-300">NFT Value</div>
                <div className="text-xs text-gray-400 mt-1">Ownership rights</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}