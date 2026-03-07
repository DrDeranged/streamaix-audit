import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Clock,
  Trophy,
  DollarSign,
  User,
  Tag,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Upload,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  Award,
  TrendingUp,
  Plus,
  Trash2,
  Info,
  Brain,
  Target,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useWeb3 } from '@/hooks/useWeb3';
import { useBounties } from '@/hooks/useBounties';
import { useEngagement } from '@/hooks/useEngagement';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatTokenAmount } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import type { Bounty } from '@shared/schema';
import { SuggestedMarketsCard } from '@/components/prediction/SuggestedMarketsCard';
import { CommentSection } from '@/components/comments/CommentSection';

interface AnalysisAnswer {
  questionId: string;
  answer: string;
}

interface UserPrediction {
  id: string;
  question: string;
  prediction: 'yes' | 'no';
  confidence: number;
  rationale: string;
}

export default function BountyDetail() {
  const { id } = useParams<{ id: string }>();
  const { wallet, isConnected } = useWeb3();
  const { claimBounty, addTip } = useBounties();
  const { toast } = useToast();
  const [tipAmount, setTipAmount] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Analysis & Prediction state
  const [analysisAnswers, setAnalysisAnswers] = useState<AnalysisAnswer[]>([]);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);

  // Fetch bounty details
  const { data: bountyData, isLoading } = useQuery<{ bounty: Bounty }>({
    queryKey: ['/api/bounties', id],
    enabled: !!id,
  });

  // Fetch quality score
  const { data: qualityData } = useQuery<{ score: number; breakdown: any; feedback: string }>({
    queryKey: ['/api/bounties', id, 'quality'],
    enabled: bountyData?.bounty?.status === 'completed',
  });

  // Fetch engagement stats
  const { data: engagementData } = useQuery<{ views: number; shares: number; likes: number }>({
    queryKey: ['/api/bounties', id, 'engagement'],
  });

  const { trackLike, trackShare } = useEngagement(id || '');

  const bounty = bountyData?.bounty;
  
  // Fetch summary data if bounty is completed and has a summaryId
  const { data: summaryData } = useQuery<{ 
    summary: { 
      id: string; 
      title: string; 
      suggestedMarkets?: any[] 
    } 
  }>({
    queryKey: ['/api/processing-result', bounty?.summaryId],
    enabled: !!bounty?.summaryId && (bounty?.status === 'completed' || bounty?.status === 'in_progress'),
  });
  const isExpired = bounty?.deadline ? new Date(bounty.deadline) < new Date() : false;
  const isOwner = wallet?.address?.toLowerCase() === bounty?.creatorWallet?.toLowerCase();
  const isClaimer = wallet?.address?.toLowerCase() === bounty?.claimerWallet?.toLowerCase();
  const canClaim = isConnected && !isOwner && !isClaimer && bounty?.status === 'open' && !isExpired;
  const canSubmit = isClaimer && bounty?.status === 'claimed';
  const canReview = isOwner && bounty?.status === 'in_progress' && bounty?.summaryId;

  // Helper functions for predictions
  const addPrediction = () => {
    if (userPredictions.length >= 5) {
      toast({
        title: 'Maximum Reached',
        description: 'You can only add up to 5 predictions.',
        variant: 'destructive',
      });
      return;
    }
    setUserPredictions([
      ...userPredictions,
      {
        id: Date.now().toString(),
        question: '',
        prediction: 'yes',
        confidence: 50,
        rationale: '',
      },
    ]);
  };

  const updatePrediction = (id: string, field: keyof UserPrediction, value: any) => {
    setUserPredictions(
      userPredictions.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removePrediction = (id: string) => {
    setUserPredictions(userPredictions.filter(p => p.id !== id));
  };

  const updateAnalysisAnswer = (questionId: string, answer: string) => {
    const existing = analysisAnswers.find(a => a.questionId === questionId);
    if (existing) {
      setAnalysisAnswers(
        analysisAnswers.map(a => (a.questionId === questionId ? { ...a, answer } : a))
      );
    } else {
      setAnalysisAnswers([...analysisAnswers, { questionId, answer }]);
    }
  };

  // Get tier info
  const tier = bounty?.engagementTier || 'basic';
  const questions = (bounty?.analysisQuestions as any[]) || [];
  const answeredCount = analysisAnswers.filter(a => a.answer.trim()).length;

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'analysis':
        return {
          icon: Brain,
          color: 'purple',
          title: 'Analysis Tier',
          description: 'Provide detailed analysis by answering all questions',
        };
      case 'prediction':
        return {
          icon: Target,
          color: 'cyan',
          title: 'Prediction Tier',
          description: 'Answer questions and make 1-5 predictions about the content',
        };
      default:
        return {
          icon: Upload,
          color: 'yellow',
          title: 'Basic Tier',
          description: 'Submit your content URL and optional notes',
        };
    }
  };

  const tierInfo = getTierInfo(tier);
  const TierIcon = tierInfo.icon;

  const handleClaim = async () => {
    // Pre-flight validation checks
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to claim this bounty.',
        variant: 'destructive',
      });
      return;
    }

    if (isOwner) {
      toast({
        title: 'Cannot Claim Own Bounty',
        description: 'You created this bounty. You cannot claim your own bounties. Try claiming a different bounty or create a new one for others to claim.',
        variant: 'destructive',
      });
      return;
    }

    if (isClaimer) {
      toast({
        title: 'Already Claimed',
        description: 'You have already claimed this bounty. Submit your work to complete it.',
        variant: 'destructive',
      });
      return;
    }

    if (bounty?.status !== 'open') {
      toast({
        title: 'Bounty Unavailable',
        description: `This bounty is ${bounty?.status}. Only open bounties can be claimed.`,
        variant: 'destructive',
      });
      return;
    }

    if (isExpired) {
      toast({
        title: 'Bounty Expired',
        description: 'This bounty has passed its deadline and can no longer be claimed.',
        variant: 'destructive',
      });
      return;
    }

    if (bounty?.contractBountyId === null || bounty?.contractBountyId === undefined) {
      toast({
        title: 'Bounty Not Initialized',
        description: 'This bounty was not properly created on the blockchain. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    // Check network
    if (wallet?.chainId !== 84532) {
      toast({
        title: 'Wrong Network',
        description: 'Please switch to Base Sepolia testnet (Chain ID: 84532) in your wallet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await claimBounty.mutateAsync({
        bountyId: bounty.id,
        contractBountyId: bounty.contractBountyId,
      });
      toast({
        title: 'Success!',
        description: 'Bounty claimed successfully. You can now work on it.',
      });
    } catch (error) {
      toast({
        title: 'Unable to claim bounty',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!submissionUrl.trim()) {
      toast({
        title: 'URL required',
        description: 'Please provide a content URL for your submission.',
        variant: 'destructive',
      });
      return;
    }

    const tier = bounty?.engagementTier || 'basic';

    // Validation based on tier
    if (tier === 'analysis' || tier === 'prediction') {
      const questions = (bounty?.analysisQuestions as any[]) || [];
      const answeredCount = analysisAnswers.filter(a => a.answer.trim()).length;
      
      if (answeredCount < questions.length) {
        toast({
          title: 'Incomplete Analysis',
          description: `Please answer all ${questions.length} analysis questions before submitting.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (tier === 'prediction') {
      if (userPredictions.length === 0) {
        toast({
          title: 'Predictions Required',
          description: 'Please add at least one prediction for this bounty.',
          variant: 'destructive',
        });
        return;
      }

      const incompletePrediction = userPredictions.find(
        p => !p.question.trim() || p.confidence === 0
      );

      if (incompletePrediction) {
        toast({
          title: 'Incomplete Prediction',
          description: 'All predictions must have a question and confidence level.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Create summary from the submission
      const response = await apiRequest('/api/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentUrl: submissionUrl,
          title: `Submission for: ${bounty?.title}`,
          description: submissionNotes || 'Bounty submission',
          bountyId: bounty?.id,
          analysisAnswers: tier !== 'basic' ? analysisAnswers : undefined,
          submitterPredictions: tier === 'prediction' ? userPredictions : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Submitted!',
          description: 'Your submission is now being processed. The creator will review it.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/bounties', id] });
        setSubmissionUrl('');
        setSubmissionNotes('');
        setAnalysisAnswers([]);
        setUserPredictions([]);
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error) {
      toast({
        title: 'Unable to submit',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTip = async () => {
    if (!bounty?.contractBountyId || !tipAmount) return;

    try {
      await addTip.mutateAsync({
        bountyId: bounty.id,
        contractBountyId: bounty.contractBountyId,
        amount: parseFloat(tipAmount),
      });
      toast({
        title: 'Tip added!',
        description: `${tipAmount} STREAM added to the bounty pool`,
      });
      setTipAmount('');
    } catch (error) {
      toast({
        title: 'Unable to add tip',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/bounties/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: bounty?.summaryId,
          completionTxHash: '0x...' // This should come from smart contract
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Bounty completed!',
        description: 'Rewards have been distributed to the hunter.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties', id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Unable to complete bounty',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const statusColors: Record<string, string> = {
    open: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    claimed: 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400',
    in_progress: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
    completed: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    expired: 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 text-xl">Loading bounty...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-4">Bounty not found</h2>
          <Link href="/#bounties">
            <Button variant="outline" className="border-purple-500/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bounties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-3" data-testid="bounty-detail-title">
                    {bounty.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{bounty.creatorWallet?.slice(0, 6)}...{bounty.creatorWallet?.slice(-4)}</span>
                    </div>
                    {bounty.createdAt && (
                      <span>Posted {formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
                <Badge className={statusColors[bounty.status]} data-testid="bounty-detail-status">
                  {bounty.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Tags */}
              {bounty.tags && bounty.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {bounty.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-purple-500/30 text-purple-300"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{bounty.description}</p>
              </div>

              {/* Content URL */}
              {bounty.contentUrl && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Content to Summarize:</p>
                  <a
                    href={bounty.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 hover:from-purple-300 hover:to-fuchsia-300 flex items-center gap-2"
                  >
                    {bounty.contentUrl}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Engagement */}
              {engagementData && (
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => trackLike.mutate()}
                    className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
                    data-testid="button-like-bounty"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{engagementData.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => trackShare.mutate()}
                    className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
                    data-testid="button-share-bounty"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{engagementData.shares || 0}</span>
                  </button>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>{engagementData.views || 0}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Submission Form (for claimers) */}
            {canSubmit && (
              <Card className={`bg-slate-900/50 border-${tierInfo.color}-500/30 backdrop-blur-sm p-6`}>
                {/* Tier Badge */}
                <div className="mb-6">
                  <Badge className={`border-${tierInfo.color}-500/50 bg-${tierInfo.color}-500/10 text-${tierInfo.color}-400 text-sm px-3 py-1`} data-testid="badge-engagement-tier">
                    <TierIcon className="w-4 h-4 mr-2" />
                    {tierInfo.title}
                  </Badge>
                  <p className="text-sm text-gray-400 mt-2">{tierInfo.description}</p>
                </div>

                {/* Info Box */}
                <div className={`mb-6 p-4 bg-${tierInfo.color}-500/10 border border-${tierInfo.color}-500/30 rounded-lg`} data-testid="info-tier-requirements">
                  <div className="flex items-start gap-3">
                    <Info className={`w-5 h-5 text-${tierInfo.color}-400 flex-shrink-0 mt-0.5`} />
                    <div>
                      <h3 className="font-semibold text-white mb-2">Requirements for {tierInfo.title}</h3>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Content URL (required)</li>
                        {(tier === 'analysis' || tier === 'prediction') && (
                          <li>• Answer all {questions.length} analysis questions</li>
                        )}
                        {tier === 'prediction' && (
                          <li>• Add 1-5 predictions with confidence levels</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Upload className={`w-5 h-5 text-${tierInfo.color}-400`} />
                  Submit Your Work
                </h2>

                <div className="space-y-6">
                  {/* Content URL */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Content URL *</label>
                    <Input
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or link to your content"
                      className={`bg-slate-800 border-${tierInfo.color}-500/30 text-white`}
                      data-testid="input-submission-url"
                    />
                  </div>

                  {/* Analysis Questions (for analysis and prediction tiers) */}
                  {(tier === 'analysis' || tier === 'prediction') && questions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-400" />
                          Analysis Questions
                        </h3>
                        <Badge variant="outline" className="text-purple-400 border-purple-500/30" data-testid="text-question-counter">
                          {answeredCount} of {questions.length} answered
                        </Badge>
                      </div>
                      {questions.map((q: any, index: number) => {
                        const answer = analysisAnswers.find(a => a.questionId === q.id)?.answer || '';
                        return (
                          <div key={q.id || index} className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                              Question {index + 1}: {q.question}
                            </label>
                            <Textarea
                              value={answer}
                              onChange={(e) => updateAnalysisAnswer(q.id || `q-${index}`, e.target.value)}
                              placeholder="Enter your detailed answer..."
                              className="bg-slate-800 border-purple-500/30 text-white min-h-[100px]"
                              data-testid={`textarea-analysis-answer-${index}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Prediction Builder (for prediction tier only) */}
                  {tier === 'prediction' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Target className="w-5 h-5 text-cyan-400" />
                          Your Predictions
                        </h3>
                        <Badge variant="outline" className="text-cyan-400 border-cyan-500/30" data-testid="text-prediction-counter">
                          {userPredictions.length} of 5 predictions
                        </Badge>
                      </div>

                      {/* Prediction List */}
                      {userPredictions.map((prediction, index) => (
                        <Card key={prediction.id} className="bg-slate-800/50 border-cyan-500/20 p-4" data-testid={`card-prediction-${index}`}>
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-sm font-medium text-cyan-400">Prediction {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePrediction(prediction.id)}
                              className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                              data-testid={`button-delete-prediction-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-400 mb-1 block">Question/Statement *</label>
                              <Input
                                value={prediction.question}
                                onChange={(e) => updatePrediction(prediction.id, 'question', e.target.value)}
                                placeholder="e.g., Will Bitcoin hit $100k by EOY?"
                                className="bg-slate-800 border-cyan-500/30 text-white"
                                data-testid={`input-prediction-question-${index}`}
                              />
                            </div>

                            <div>
                              <label className="text-sm text-gray-400 mb-2 block">Your Stance *</label>
                              <RadioGroup
                                value={prediction.prediction}
                                onValueChange={(value: 'yes' | 'no') => updatePrediction(prediction.id, 'prediction', value)}
                                className="flex gap-4"
                                data-testid={`radio-prediction-stance-${index}`}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="yes" id={`${prediction.id}-yes`} />
                                  <label htmlFor={`${prediction.id}-yes`} className="text-sm text-white cursor-pointer">
                                    YES
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="no" id={`${prediction.id}-no`} />
                                  <label htmlFor={`${prediction.id}-no`} className="text-sm text-white cursor-pointer">
                                    NO
                                  </label>
                                </div>
                              </RadioGroup>
                            </div>

                            <div>
                              <label className="text-sm text-gray-400 mb-2 block">
                                Confidence: {prediction.confidence}%
                              </label>
                              <Slider
                                value={[prediction.confidence]}
                                onValueChange={(value) => updatePrediction(prediction.id, 'confidence', value[0])}
                                min={0}
                                max={100}
                                step={5}
                                className="w-full"
                                data-testid={`slider-prediction-confidence-${index}`}
                              />
                            </div>

                            <div>
                              <label className="text-sm text-gray-400 mb-1 block">Rationale (Optional)</label>
                              <Textarea
                                value={prediction.rationale}
                                onChange={(e) => updatePrediction(prediction.id, 'rationale', e.target.value)}
                                placeholder="Explain why you believe this..."
                                className="bg-slate-800 border-cyan-500/30 text-white min-h-[80px]"
                                data-testid={`textarea-prediction-rationale-${index}`}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}

                      {/* Add Prediction Button */}
                      {userPredictions.length < 5 && (
                        <Button
                          onClick={addPrediction}
                          variant="outline"
                          className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                          data-testid="button-add-prediction"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Prediction ({userPredictions.length}/5)
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Additional Notes (Optional)</label>
                    <Textarea
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="Any additional context or highlights..."
                      className={`bg-slate-800 border-${tierInfo.color}-500/30 text-white min-h-[100px]`}
                      data-testid="textarea-submission-notes"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !submissionUrl.trim()}
                    className={`w-full bg-gradient-to-r from-${tierInfo.color}-500 to-${tierInfo.color === 'yellow' ? 'orange' : tierInfo.color}-600 hover:from-${tierInfo.color}-600 hover:to-${tierInfo.color === 'yellow' ? 'orange' : tierInfo.color}-700`}
                    data-testid="button-submit-work"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {isSubmitting 
                      ? 'Submitting...' 
                      : tier === 'prediction' 
                      ? 'Submit Predictions' 
                      : tier === 'analysis' 
                      ? 'Submit Analysis' 
                      : 'Submit for Review'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Review Interface (for creators) */}
            {canReview && (
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  Review Submission
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Submission ID:</p>
                    <Link href={`/summaries/${bounty.summaryId}`}>
                      <a className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 hover:from-purple-300 hover:to-fuchsia-300 flex items-center gap-2">
                        View Summary
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Link>
                  </div>
                  {qualityData && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">AI Quality Score:</p>
                      <p className="text-3xl font-bold text-purple-400">{qualityData.score}/100</p>
                      {qualityData.feedback && (
                        <p className="text-sm text-gray-300 mt-2">{qualityData.feedback}</p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove.mutate()}
                      disabled={handleApprove.isPending}
                      className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600"
                      data-testid="button-approve-submission"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approve & Pay Reward
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Quality Score (for completed) */}
            {bounty.status === 'completed' && qualityData && (
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Quality Analysis
                </h2>
                <div className="text-center mb-6">
                  <p className="text-5xl font-bold text-purple-400 mb-2">{qualityData.score}/100</p>
                  <p className="text-gray-400">Overall Quality Score</p>
                </div>
                {qualityData.breakdown && (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(qualityData.breakdown).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-lg font-semibold text-white">{value}/100</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reward Info */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Reward</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Base Reward</p>
                      <p className="text-2xl font-bold text-white">{Number(bounty.reward || 0).toLocaleString()} STREAM</p>
                    </div>
                  </div>
                </div>

                {(bounty.tipPool ?? 0) > 0 && (
                  <div className="p-4 bg-fuchsia-500/10 rounded-lg border border-fuchsia-500/30">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-fuchsia-400" />
                      <div>
                        <p className="text-sm text-gray-400">Tip Pool</p>
                        <p className="text-xl font-bold text-white">{Number(bounty.tipPool || 0).toLocaleString()} STREAM</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Total Reward:</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
                      {((bounty.reward || 0) + (bounty.tipPool || 0)).toLocaleString()} STREAM
                    </span>
                  </div>
                </div>

                {/* Add Tip */}
                {isConnected && !isOwner && (
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-3">Add to tip pool:</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        placeholder="Amount"
                        className="bg-slate-800 border-purple-500/30 text-white"
                        data-testid="input-tip-amount"
                      />
                      <Button
                        onClick={handleAddTip}
                        disabled={addTip.isPending || !tipAmount}
                        variant="outline"
                        className="border-purple-500/50"
                        data-testid="button-add-tip"
                      >
                        Tip
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Deadline & Details */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
              <div className="space-y-3">
                {bounty.deadline && (
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isExpired ? 'text-fuchsia-400' : 'text-purple-400'}`} />
                    <div>
                      <p className="text-sm text-gray-400">Deadline</p>
                      <p className={`font-medium ${isExpired ? 'text-fuchsia-400' : 'text-white'}`}>
                        {isExpired ? 'Expired' : formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )}

                {bounty.difficulty && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Difficulty</p>
                      <p className="font-medium text-white capitalize">{bounty.difficulty}</p>
                    </div>
                  </div>
                )}

                {bounty.category && (
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-fuchsia-400" />
                    <div>
                      <p className="text-sm text-gray-400">Category</p>
                      <p className="font-medium text-white">{bounty.category}</p>
                    </div>
                  </div>
                )}

                {bounty.claimerWallet && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-gray-400">Claimed by</p>
                      <p className="font-medium text-white font-mono text-sm">
                        {bounty.claimerWallet.slice(0, 6)}...{bounty.claimerWallet.slice(-4)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* AI-Suggested Markets (show when bounty is completed and summary has markets) */}
            {bounty.status === 'completed' && summaryData?.summary?.suggestedMarkets && summaryData.summary.suggestedMarkets.length > 0 && (
              <SuggestedMarketsCard
                suggestedMarkets={summaryData.summary.suggestedMarkets}
                summaryId={bounty.summaryId || ''}
                summaryTitle={summaryData.summary.title || bounty.title}
              />
            )}

            {/* Action Button */}
            {canClaim && (
              <Button
                onClick={handleClaim}
                disabled={claimBounty.isPending}
                className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 text-lg py-6"
                data-testid="button-claim-bounty"
              >
                <Trophy className="w-5 h-5 mr-2" />
                {claimBounty.isPending ? 'Claiming...' : 'Claim Bounty'}
              </Button>
            )}

            {isClaimer && bounty.status === 'claimed' && (
              <div className="p-4 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg">
                <p className="text-fuchsia-400 text-sm font-medium">You've claimed this bounty!</p>
                <p className="text-gray-400 text-xs mt-1">Submit your work using the form above.</p>
              </div>
            )}

            {!isConnected && canClaim && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-purple-400 text-sm">Connect your wallet to claim this bounty</p>
              </div>
            )}

            {/* Comments Section */}
            {bounty && (
              <div className="mt-8">
                <CommentSection entityType="bounty" entityId={bounty.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
