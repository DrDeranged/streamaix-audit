import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus, X, FileText, BarChart3, TrendingUp, Sparkles, Coins, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { useBounties } from '@/hooks/useBounties';
import { usePointsBalance } from '@/hooks/usePoints';
import { cn } from '@/lib/utils';

type EngagementTier = 'basic' | 'analysis' | 'prediction';

const createBountySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(1000, 'Description too long'),
  reward: z.number().min(1, 'Reward must be at least 1 $STREAM').max(10000, 'Reward too high'),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
  engagementTier: z.enum(['basic', 'analysis', 'prediction']).default('basic'),
});

type CreateBountyFormData = z.infer<typeof createBountySchema>;

interface CreateBountyModalProps {
  onSuccess?: () => void;
}

const TIER_CONFIG = {
  basic: {
    name: 'BASIC',
    multiplier: 1,
    icon: FileText,
    color: 'cyan',
    description: 'Just summary',
    requirements: 'Create a comprehensive summary of the content',
    minQuestions: 0,
    maxQuestions: 0,
  },
  analysis: {
    name: 'ANALYSIS',
    multiplier: 1.5,
    icon: BarChart3,
    color: 'purple',
    description: 'Summary + answer questions',
    requirements: 'Summary plus detailed analysis answering custom questions',
    minQuestions: 2,
    maxQuestions: 5,
  },
  prediction: {
    name: 'PREDICTION',
    multiplier: 2,
    icon: TrendingUp,
    color: 'violet',
    description: 'Summary + analysis + market predictions',
    requirements: 'Full analysis with market predictions and insights',
    minQuestions: 1,
    maxQuestions: 3,
  },
} as const;

export default function CreateBountyModal({ onSuccess }: CreateBountyModalProps) {
  const { createBounty } = useBounties();
  const { data: pointsData, isLoading: pointsLoading } = usePointsBalance();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [analysisQuestions, setAnalysisQuestions] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  
  const userBalance = pointsData?.balance || 0;

  const form = useForm<CreateBountyFormData>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      title: '',
      description: '',
      reward: 100,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      engagementTier: 'basic',
    },
  });

  const selectedTier = form.watch('engagementTier');
  const baseReward = form.watch('reward');
  const tierMultiplier = TIER_CONFIG[selectedTier].multiplier;
  const finalReward = Math.round(baseReward * tierMultiplier);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddQuestion = () => {
    const config = TIER_CONFIG[selectedTier];
    if (
      questionInput.trim() &&
      !analysisQuestions.includes(questionInput.trim()) &&
      analysisQuestions.length < config.maxQuestions
    ) {
      setAnalysisQuestions([...analysisQuestions, questionInput.trim()]);
      setQuestionInput('');
    }
  };

  const handleRemoveQuestion = (questionToRemove: string) => {
    setAnalysisQuestions(analysisQuestions.filter((q) => q !== questionToRemove));
  };

  const validateQuestions = () => {
    const config = TIER_CONFIG[selectedTier];
    if (selectedTier === 'basic') return true;
    
    if (analysisQuestions.length < config.minQuestions) {
      return false;
    }
    if (analysisQuestions.length > config.maxQuestions) {
      return false;
    }
    return true;
  };

  const onSubmit = async (data: CreateBountyFormData) => {
    if (!validateQuestions()) {
      const config = TIER_CONFIG[selectedTier];
      form.setError('root', {
        message: `Please add ${config.minQuestions}-${config.maxQuestions} questions for ${config.name} tier`,
      });
      return;
    }

    await createBounty.mutateAsync({
      ...data,
      reward: finalReward,
      tags,
      engagementTier: selectedTier,
      analysisQuestions: selectedTier !== 'basic' ? analysisQuestions : [],
    });
    
    form.reset();
    setTags([]);
    setAnalysisQuestions([]);
    onSuccess?.();
  };

  const hasInsufficientBalance = finalReward > userBalance;

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle as="h1" className="mb-2">Create New Bounty</SectionTitle>
        <p className="text-sm text-secondary">
          Offer STREAM points to creators who transform your requested content into summaries
        </p>
      </div>

      {/* Balance Display */}
      <Surface className={cn(
        "flex items-center justify-between p-4",
        hasInsufficientBalance 
          ? "bg-loss/10 border-loss/30" 
          : "bg-accent-core/10 border-accent-core/30"
      )}>
        <div className="flex items-center gap-2">
          <Coins className={cn("w-5 h-5", hasInsufficientBalance ? "text-loss" : "text-warn")} />
          <span className="text-body">Your Balance:</span>
          <span className={cn("font-bold tabular", hasInsufficientBalance ? "text-loss" : "text-warn")}>
            {pointsLoading ? "..." : userBalance.toLocaleString()} STREAM
          </span>
        </div>
        {hasInsufficientBalance && (
          <div className="flex items-center gap-2 text-loss text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Insufficient balance for {finalReward.toLocaleString()} STREAM reward</span>
          </div>
        )}
      </Surface>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-body">Title *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Summarize Lex Fridman's interview with Vitalik"
                    className="bg-ink-raised border-ink-edge text-primary focus:border-accent-core rounded-xl"
                    data-testid="input-bounty-title"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-body">Description *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Provide details about the content to summarize, key topics to focus on, and any specific requirements..."
                    className="bg-ink-raised border-ink-edge text-primary focus:border-accent-core rounded-xl min-h-[120px]"
                    data-testid="textarea-bounty-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Engagement Tier Selector */}
          <FormField
            control={form.control}
            name="engagementTier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-body flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-bright" />
                  Engagement Tier *
                </FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {(Object.keys(TIER_CONFIG) as EngagementTier[]).map((tier) => {
                    const config = TIER_CONFIG[tier];
                    const Icon = config.icon;
                    const isSelected = field.value === tier;
                    
                    return (
                      <Surface
                        variant={isSelected ? "panel" : "raised"}
                        key={tier}
                        className={cn(
                          'cursor-pointer transition-all hover:bg-ink-raised',
                          isSelected
                            ? 'border-2 border-accent-core bg-accent-core/10 glow-accent'
                            : 'border border-ink-edge hover:border-accent-core/50'
                        )}
                        onClick={() => {
                          field.onChange(tier);
                          if (tier === 'basic') {
                            setAnalysisQuestions([]);
                          }
                        }}
                        data-testid={`card-tier-${tier}`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Icon className={cn(
                              'w-6 h-6',
                              isSelected ? 'text-accent-bright' : 'text-muted'
                            )} />
                            <Badge
                              variant="outline"
                              className={cn(
                                isSelected
                                   ? 'border-accent-core text-accent-bright'
                                   : 'border-ink-edge text-muted'
                              )}
                              data-testid={`badge-multiplier-${tier}`}
                            >
                              {config.multiplier}x
                            </Badge>
                          </div>
                          <h3 className={cn(
                            'text-lg',
                            isSelected ? 'text-accent-bright' : 'text-body'
                          )}>
                            {config.name}
                          </h3>
                          <p className="text-xs text-secondary mt-1">
                            {config.description}
                          </p>
                        </div>
                        <div className="p-4 pt-0">
                          <p className="text-xs text-muted">
                            {config.requirements}
                          </p>
                          {config.maxQuestions > 0 && (
                            <p className="text-xs text-accent-bright mt-2">
                              {config.minQuestions}-{config.maxQuestions} custom questions
                            </p>
                          )}
                        </div>
                      </Surface>
                    );
                  })}
                </div>
                <p className="text-xs text-secondary mt-2">
                  Higher tiers require more detailed analysis and offer higher rewards
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Question Builder for Analysis/Prediction Tiers */}
          {selectedTier !== 'basic' && (
            <Surface variant="raised" className="space-y-3 p-4 border border-accent-core/30">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-bright" />
                <FormLabel className="text-body mb-0">
                  Analysis Questions *
                </FormLabel>
              </div>
              <p className="text-xs text-secondary">
                Add {TIER_CONFIG[selectedTier].minQuestions}-{TIER_CONFIG[selectedTier].maxQuestions} questions that creators must answer in their analysis
              </p>
              
              <div className="flex gap-2">
                <Input
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddQuestion();
                    }
                  }}
                  placeholder={
                    selectedTier === 'prediction'
                      ? 'e.g., What are the key market indicators to watch?'
                      : 'e.g., What are the main themes discussed?'
                  }
                  className="flex-1 bg-ink-raised border-ink-edge text-primary focus:border-accent-core rounded-xl"
                  disabled={analysisQuestions.length >= TIER_CONFIG[selectedTier].maxQuestions}
                  data-testid="input-analysis-question"
                />
                <Button
                  type="button"
                  onClick={handleAddQuestion}
                  variant="outline"
                  className="border-accent-core/50 hover:bg-accent-core/10 rounded-xl"
                  disabled={
                    !questionInput.trim() ||
                    analysisQuestions.length >= TIER_CONFIG[selectedTier].maxQuestions
                  }
                  data-testid="button-add-question"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {analysisQuestions.length > 0 && (
                <div className="space-y-2">
                  {analysisQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-ink-raised rounded-xl border border-ink-edge"
                      data-testid={`question-item-${index}`}
                    >
                      <span className="flex-1 text-sm text-body">{question}</span>
                      <Button
                        type="button"
                        onClick={() => handleRemoveQuestion(question)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-loss/20 hover:text-loss rounded-xl"
                        data-testid={`button-remove-question-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-accent-bright">
                {analysisQuestions.length}/{TIER_CONFIG[selectedTier].maxQuestions} questions added
                {analysisQuestions.length < TIER_CONFIG[selectedTier].minQuestions && (
                  <span className="text-loss ml-2">
                    (Minimum {TIER_CONFIG[selectedTier].minQuestions} required)
                  </span>
                )}
              </p>
            </Surface>
          )}

          {/* Reward Amount */}
          <FormField
            control={form.control}
            name="reward"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-body">Base Reward Amount ($STREAM) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    max="10000"
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    className="bg-ink-raised border-ink-edge text-primary focus:border-accent-core rounded-xl"
                    data-testid="input-bounty-reward"
                  />
                </FormControl>
                <Surface variant="raised" className="mt-2 p-3 border border-accent-core/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-body">Final Reward (with {tierMultiplier}x multiplier):</span>
                    <span
                      className="text-lg font-bold text-accent-bright tabular"
                      data-testid="text-final-reward"
                    >
                      {finalReward} $STREAM
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1">
                    {baseReward} × {tierMultiplier} = {finalReward} points
                  </p>
                </Surface>
                <p className="text-xs text-secondary mt-1">
                  You'll need to approve {finalReward} STREAM points
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Deadline */}
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-body">Deadline *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'bg-ink-raised border-ink-edge text-primary hover:bg-ink-surface justify-start text-left font-normal rounded-xl',
                          !field.value && 'text-muted'
                        )}
                        data-testid="button-select-deadline"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-ink-surface border-ink-edge rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="bg-ink-surface text-primary"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags */}
          <div className="space-y-2">
            <FormLabel className="text-body">Tags (Optional)</FormLabel>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag (e.g., crypto, tech, business)"
                className="flex-1 bg-ink-raised border-ink-edge text-primary focus:border-accent-core rounded-xl"
                disabled={tags.length >= 5}
                data-testid="input-bounty-tag"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                className="border-accent-core/50 hover:bg-accent-core/10 rounded-xl"
                disabled={!tagInput.trim() || tags.length >= 5}
                data-testid="button-add-tag"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-accent-core/50 text-accent-bright"
                    data-testid={`tag-${tag}`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-primary"
                      data-testid={`button-remove-tag-${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-secondary">{tags.length}/5 tags added</p>
          </div>

          {/* Form Error Display */}
          {form.formState.errors.root && (
            <Surface variant="raised" className="border border-loss/30 p-4">
              <p className="text-sm text-loss" data-testid="text-form-error">
                {form.formState.errors.root.message}
              </p>
            </Surface>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-ink-divider">
            <Button
              type="submit"
              disabled={createBounty.isPending || hasInsufficientBalance}
              className={cn(
                "flex-1",
                hasInsufficientBalance 
                  ? "bg-ink-raised text-muted cursor-not-allowed" 
                  : "grad-accent hover:bg-accent-deep glow-accent"
              )}
              data-testid="button-submit-bounty"
            >
              {createBounty.isPending ? (
                'Creating Bounty...'
              ) : hasInsufficientBalance ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Insufficient Balance
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bounty ({finalReward.toLocaleString()} STREAM)
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <Surface variant="raised" className="border border-accent-core/30 p-4">
            <p className="text-sm text-accent-bright">
              <strong>Engagement Tiers:</strong>
              <br />
              • <strong>BASIC (1x):</strong> Summary only - perfect for quick insights
              <br />
              • <strong>ANALYSIS (1.5x):</strong> Summary + custom questions - deeper understanding
              <br />
              • <strong>PREDICTION (2x):</strong> Full analysis + market predictions - maximum value
              <br />
              <br />
              <strong>Note:</strong> Creating a bounty requires {finalReward} STREAM points and two transactions:
              <br />
              1. Approve token transfer
              <br />
              2. Create bounty on blockchain
            </p>
          </Surface>
        </form>
      </Form>
    </div>
  );
}
