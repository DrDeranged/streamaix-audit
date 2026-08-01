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
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';

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
    open: 'border-accent-core/50 bg-accent-core/10 text-accent-bright',
    claimed: 'border-warn/50 bg-warn/10 text-warn',
    in_progress: 'border-accent-core/50 bg-accent-core/10 text-accent-bright',
    completed: 'border-gain/50 bg-gain/10 text-gain',
    expired: 'border-loss/50 bg-loss/10 text-loss',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <div className="text-primary text-xl">Loading bounty...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-primary mb-4">Bounty not found</h2>
          <Link href="/#bounties">
            <Button variant="outline" className="border-ink-edge text-secondary rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bounties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Surface className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <SectionTitle as="h1" className="mb-3 text-3xl font-bold" data-testid="bounty-detail-title">
                    {bounty.title}
                  </SectionTitle>
                  <div className="flex items-center gap-4 text-sm text-secondary">
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
                       className="border-accent-core/30 text-accent-bright rounded-xl"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="prose prose-invert max-w-none">
                <p className="text-body whitespace-pre-wrap">{bounty.description}</p>
              </div>

              {/* Content URL */}
              {bounty.contentUrl && (
                <div className="mt-4 p-4 bg-ink-raised rounded-xl">
                  <p className="text-sm text-muted mb-2">Content to Summarize:</p>
                  <a
                    href={bounty.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-bright hover:text-primary flex items-center gap-2"
                  >
                    {bounty.contentUrl}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Engagement */}
              {engagementData && (
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-ink-divider">
                  <button
                    onClick={() => trackLike.mutate()}
                    className="flex items-center gap-2 text-secondary hover:text-loss transition-colors"
                    data-testid="button-like-bounty"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{engagementData.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => trackShare.mutate()}
                    className="flex items-center gap-2 text-secondary hover:text-accent-bright transition-colors"
                    data-testid="button-share-bounty"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{engagementData.shares || 0}</span>
                  </button>
                  <div className="flex items-center gap-2 text-secondary">
                    <Eye className="w-4 h-4" />
                    <span>{engagementData.views || 0}</span>
                  </div>
                </div>
              )}
            </Surface>

            {/* Submission Form (for claimers) */}
            {canSubmit && (
              <Surface className="p-6">
                {/* Tier Badge */}
                <div className="mb-6">
                  <Badge className={`border-${tierInfo.color}-500/50 bg-${tierInfo.color}-500/10 text-${tierInfo.color}-400 text-sm px-3 py-1`} data-testid="badge-engagement-tier">
                    <TierIcon className="w-4 h-4 mr-2" />
                    {tierInfo.title}
                  </Badge>
                  <p className="text-sm text-secondary mt-2">{tierInfo.description}</p>
                </div>

                {/* Info Box */}
                <div className="mb-6 p-4 bg-ink-raised border border-ink-edge rounded-xl" data-testid="info-tier-requirements">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent-bright flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-primary mb-2">Requirements for {tierInfo.title}</h3>
                      <ul className="text-sm text-body space-y-1">
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

                <SectionTitle as="h2" className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Upload className="w-5 h-5 text-accent-bright" />
                  Submit Your Work
                </SectionTitle>

                <div className="space-y-6">
                  {/* Content URL */}
                  <div>
                    <label className="text-sm text-muted mb-2 block">Content URL *</label>
                    <Input
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or link to your content"
                      className="bg-ink-raised border-ink-edge text-primary rounded-xl"
                      data-testid="input-submission-url"
                    />
                  </div>

                  {/* Analysis Questions (for analysis and prediction tiers) */}
                  {(tier === 'analysis' || tier === 'prediction') && questions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                          <Brain className="w-5 h-5 text-accent-bright" />
                          Analysis Questions
                        </h3>
                        <Badge variant="outline" className="text-accent-bright border-accent-core/30 rounded-xl" data-testid="text-question-counter">
                          {answeredCount} of {questions.length} answered
                        </Badge>
                      </div>
                      {questions.map((q: any, index: number) => {
                        const answer = analysisAnswers.find(a => a.questionId === q.id)?.answer || '';
                        return (
                          <div key={q.id || index} className="p-4 bg-ink-raised rounded-xl border border-ink-edge">
                            <label className="text-sm font-medium text-body mb-2 block">
                              Question {index + 1}: {q.question}
                            </label>
                            <Textarea
                              value={answer}
                              onChange={(e) => updateAnalysisAnswer(q.id || `q-${index}`, e.target.value)}
                              placeholder="Enter your detailed answer..."
                              className="bg-ink-surface border-ink-edge text-primary rounded-xl min-h-[100px]"
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
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                          <Target className="w-5 h-5 text-accent-bright" />
                          Your Predictions
                        </h3>
                        <Badge variant="outline" className="text-accent-bright border-accent-core/30 rounded-xl" data-testid="text-prediction-counter">
                          {userPredictions.length} of 5 predictions
                        </Badge>
                      </div>

                      {/* Prediction List */}
                      {userPredictions.map((prediction, index) => (
                        <Surface variant="raised" key={prediction.id} className="border border-ink-edge p-4" data-testid={`card-prediction-${index}`}>
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-sm font-medium text-accent-bright">Prediction {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePrediction(prediction.id)}
                              className="text-loss hover:text-primary h-6 w-6 p-0"
                              data-testid={`button-delete-prediction-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-muted mb-1 block">Question/Statement *</label>
                              <Input
                                value={prediction.question}
                                onChange={(e) => updatePrediction(prediction.id, 'question', e.target.value)}
                                placeholder="e.g., Will Bitcoin hit $100k by EOY?"
                                className="bg-ink-surface border-ink-edge text-primary rounded-xl"
                                data-testid={`input-prediction-question-${index}`}
                              />
                            </div>

                            <div>
                              <label className="text-sm text-muted mb-2 block">Your Stance *</label>
                              <RadioGroup
                                value={prediction.prediction}
                                onValueChange={(value: 'yes' | 'no') => updatePrediction(prediction.id, 'prediction', value)}
                                className="flex gap-4"
                                data-testid={`radio-prediction-stance-${index}`}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="yes" id={`${prediction.id}-yes`} />
                                  <label htmlFor={`${prediction.id}-yes`} className="text-sm text-primary cursor-pointer">
                                    YES
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="no" id={`${prediction.id}-no`} />
                                  <label htmlFor={`${prediction.id}-no`} className="text-sm text-primary cursor-pointer">
                                    NO
                                  </label>
                                </div>
                              </RadioGroup>
                            </div>

                            <div>
                              <label className="text-sm text-muted mb-2 block">
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
                              <label className="text-sm text-muted mb-1 block">Rationale (Optional)</label>
                              <Textarea
                                value={prediction.rationale}
                                onChange={(e) => updatePrediction(prediction.id, 'rationale', e.target.value)}
                                placeholder="Explain why you believe this..."
                                className="bg-ink-surface border-ink-edge text-primary rounded-xl min-h-[80px]"
                                data-testid={`textarea-prediction-rationale-${index}`}
                              />
                            </div>
                          </div>
                        </Surface>
                      ))}

                      {/* Add Prediction Button */}
                      {userPredictions.length < 5 && (
                        <Button
                          onClick={addPrediction}
                          variant="outline"
                          className="w-full border-accent-core/30 text-accent-bright hover:bg-accent-core/10 rounded-xl"
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
                    <label className="text-sm text-muted mb-2 block">Additional Notes (Optional)</label>
                    <Textarea
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="Any additional context or highlights..."
                      className="bg-ink-surface border-ink-edge text-primary rounded-xl min-h-[100px]"
                      data-testid="textarea-submission-notes"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !submissionUrl.trim()}
                    className="w-full grad-accent glow-accent rounded-xl"
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
              </Surface>
            )}

            {/* Review Interface (for creators) */}
            {canReview && (
              <Surface className="p-6">
                <SectionTitle as="h2" className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Award className="w-5 h-5 text-accent-bright" />
                  Review Submission
                </SectionTitle>
                <div className="space-y-4">
                  <div className="p-4 bg-ink-raised rounded-xl">
                    <p className="text-sm text-muted mb-2">Submission ID:</p>
                    <Link href={`/summaries/${bounty.summaryId}`}>
                      <span className="text-accent-bright hover:text-primary flex items-center gap-2">
                        View Summary
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    </Link>
                  </div>
                  {qualityData && (
                    <div className="p-4 bg-ink-raised border border-ink-edge rounded-xl">
                      <p className="text-sm text-muted mb-2">AI Quality Score:</p>
                      <p className="text-3xl font-bold text-accent-bright tabular">{qualityData.score}/100</p>
                      {qualityData.feedback && (
                        <p className="text-sm text-body mt-2">{qualityData.feedback}</p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove.mutate()}
                      disabled={handleApprove.isPending}
                      className="flex-1 grad-accent glow-accent rounded-xl"
                      data-testid="button-approve-submission"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approve & Pay Reward
                    </Button>
                  </div>
                </div>
              </Surface>
            )}

            {/* Quality Score (for completed) */}
            {bounty.status === 'completed' && qualityData && (
              <Surface className="p-6">
                <SectionTitle as="h2" className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <TrendingUp className="w-5 h-5 text-accent-bright" />
                  Quality Analysis
                </SectionTitle>
                <div className="text-center mb-6">
                  <p className="text-5xl font-bold text-accent-bright mb-2 tabular">{qualityData.score}/100</p>
                  <p className="text-secondary">Overall Quality Score</p>
                </div>
                {qualityData.breakdown && (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(qualityData.breakdown).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-3 bg-ink-raised rounded-xl">
                        <p className="text-sm text-muted capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-lg font-semibold text-primary tabular">{value}/100</p>
                      </div>
                    ))}
                  </div>
                )}
              </Surface>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reward Info */}
            <Surface className="p-6">
              <SectionTitle as="h3" className="mb-4 text-lg font-semibold">Reward</SectionTitle>
              <div className="space-y-4">
                <div className="p-4 bg-ink-raised rounded-xl border border-ink-edge">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-6 h-6 text-accent-bright" />
                    <div>
                      <p className="text-sm text-muted">Base Reward</p>
                      <p className="text-2xl font-bold text-primary tabular">{Number(bounty.reward || 0).toLocaleString()} STREAM</p>
                    </div>
                  </div>
                </div>

                {(bounty.tipPool ?? 0) > 0 && (
                  <div className="p-4 bg-ink-raised rounded-xl border border-ink-edge">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-accent-bright" />
                      <div>
                        <p className="text-sm text-muted">Tip Pool</p>
                        <p className="text-xl font-bold text-primary tabular">{Number(bounty.tipPool || 0).toLocaleString()} STREAM</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-ink-divider">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-secondary">Total Reward:</span>
                    <span className="text-2xl font-bold text-accent-bright tabular">
                      {((bounty.reward || 0) + (bounty.tipPool || 0)).toLocaleString()} STREAM
                    </span>
                  </div>
                </div>

                {/* Add Tip */}
                {isConnected && !isOwner && (
                  <div className="pt-4 border-t border-ink-divider">
                    <p className="text-sm text-muted mb-3">Add to tip pool:</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        placeholder="Amount"
                        className="bg-ink-raised border-ink-edge text-primary rounded-xl"
                        data-testid="input-tip-amount"
                      />
                      <Button
                        onClick={handleAddTip}
                        disabled={addTip.isPending || !tipAmount}
                        variant="outline"
                        className="border-accent-core/50 text-accent-bright rounded-xl"
                        data-testid="button-add-tip"
                      >
                        Tip
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Surface>

            {/* Deadline & Details */}
            <Surface className="p-6">
              <SectionTitle as="h3" className="mb-4 text-lg font-semibold">Details</SectionTitle>
              <div className="space-y-3">
                {bounty.deadline && (
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isExpired ? 'text-warn' : 'text-accent-bright'}`} />
                    <div>
                      <p className="text-sm text-secondary">Deadline</p>
                      <p className={`font-medium ${isExpired ? 'text-warn' : 'text-primary'}`}>
                        {isExpired ? 'Expired' : formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )}

                {bounty.difficulty && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-accent-bright" />
                    <div>
                      <p className="text-sm text-secondary">Difficulty</p>
                      <p className="font-medium text-primary capitalize">{bounty.difficulty}</p>
                    </div>
                  </div>
                )}

                {bounty.category && (
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-warn" />
                    <div>
                      <p className="text-sm text-secondary">Category</p>
                      <p className="font-medium text-primary">{bounty.category}</p>
                    </div>
                  </div>
                )}

                {bounty.claimerWallet && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-accent-bright" />
                    <div>
                      <p className="text-sm text-secondary">Claimed by</p>
                      <p className="font-medium text-primary font-mono text-sm">
                        {bounty.claimerWallet.slice(0, 6)}...{bounty.claimerWallet.slice(-4)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Surface>

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
                className="w-full grad-accent glow-accent rounded-xl text-lg py-6"
                data-testid="button-claim-bounty"
              >
                <Trophy className="w-5 h-5 mr-2" />
                {claimBounty.isPending ? 'Claiming...' : 'Claim Bounty'}
              </Button>
            )}

            {isClaimer && bounty.status === 'claimed' && (
              <div className="p-4 bg-ink-raised border border-ink-edge rounded-xl">
                <p className="text-warn text-sm font-medium">You've claimed this bounty!</p>
                <p className="text-secondary text-xs mt-1">Submit your work using the form above.</p>
              </div>
            )}

            {!isConnected && canClaim && (
              <div className="p-4 bg-ink-raised border border-ink-edge rounded-xl">
                <p className="text-accent-bright text-sm">Connect your wallet to claim this bounty</p>
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
