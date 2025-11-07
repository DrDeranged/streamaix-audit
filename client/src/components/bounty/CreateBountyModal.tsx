import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus, X, FileText, BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBounties } from '@/hooks/useBounties';
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [analysisQuestions, setAnalysisQuestions] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 mb-2">
          Create New Bounty
        </h2>
        <p className="text-sm text-gray-400">
          Offer STREAM points to creators who transform your requested content into summaries
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Title *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Summarize Lex Fridman's interview with Vitalik"
                    className="bg-slate-800 border-cyan-500/30 text-white focus:border-cyan-500"
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
                <FormLabel className="text-gray-300">Description *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Provide details about the content to summarize, key topics to focus on, and any specific requirements..."
                    className="bg-slate-800 border-cyan-500/30 text-white focus:border-cyan-500 min-h-[120px]"
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
                <FormLabel className="text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Engagement Tier *
                </FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {(Object.keys(TIER_CONFIG) as EngagementTier[]).map((tier) => {
                    const config = TIER_CONFIG[tier];
                    const Icon = config.icon;
                    const isSelected = field.value === tier;
                    
                    return (
                      <Card
                        key={tier}
                        className={cn(
                          'cursor-pointer transition-all hover:scale-105',
                          isSelected
                            ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-500/20 to-cyan-500/20'
                            : 'border border-slate-700 bg-slate-800/50 hover:border-purple-500/50'
                        )}
                        onClick={() => {
                          field.onChange(tier);
                          if (tier === 'basic') {
                            setAnalysisQuestions([]);
                          }
                        }}
                        data-testid={`card-tier-${tier}`}
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Icon className={cn(
                              'w-6 h-6',
                              isSelected ? 'text-purple-400' : 'text-gray-400'
                            )} />
                            <Badge
                              variant="outline"
                              className={cn(
                                isSelected
                                  ? 'border-purple-400 text-purple-300'
                                  : 'border-gray-600 text-gray-400'
                              )}
                              data-testid={`badge-multiplier-${tier}`}
                            >
                              {config.multiplier}x
                            </Badge>
                          </div>
                          <CardTitle className={cn(
                            'text-lg',
                            isSelected ? 'text-purple-300' : 'text-gray-300'
                          )}>
                            {config.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-400 mt-1">
                            {config.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-xs text-gray-500">
                            {config.requirements}
                          </p>
                          {config.maxQuestions > 0 && (
                            <p className="text-xs text-purple-400 mt-2">
                              {config.minQuestions}-{config.maxQuestions} custom questions
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Higher tiers require more detailed analysis and offer higher rewards
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Question Builder for Analysis/Prediction Tiers */}
          {selectedTier !== 'basic' && (
            <div className="space-y-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <FormLabel className="text-gray-300 mb-0">
                  Analysis Questions *
                </FormLabel>
              </div>
              <p className="text-xs text-gray-400">
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
                  className="flex-1 bg-slate-800 border-purple-500/30 text-white focus:border-purple-500"
                  disabled={analysisQuestions.length >= TIER_CONFIG[selectedTier].maxQuestions}
                  data-testid="input-analysis-question"
                />
                <Button
                  type="button"
                  onClick={handleAddQuestion}
                  variant="outline"
                  className="border-purple-500/50 hover:bg-purple-500/10"
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
                      className="flex items-center gap-2 p-2 bg-slate-800 rounded border border-purple-500/30"
                      data-testid={`question-item-${index}`}
                    >
                      <span className="flex-1 text-sm text-gray-300">{question}</span>
                      <Button
                        type="button"
                        onClick={() => handleRemoveQuestion(question)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400"
                        data-testid={`button-remove-question-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-purple-400">
                {analysisQuestions.length}/{TIER_CONFIG[selectedTier].maxQuestions} questions added
                {analysisQuestions.length < TIER_CONFIG[selectedTier].minQuestions && (
                  <span className="text-red-400 ml-2">
                    (Minimum {TIER_CONFIG[selectedTier].minQuestions} required)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Reward Amount */}
          <FormField
            control={form.control}
            name="reward"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Base Reward Amount ($STREAM) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    max="10000"
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    className="bg-slate-800 border-cyan-500/30 text-white focus:border-cyan-500"
                    data-testid="input-bounty-reward"
                  />
                </FormControl>
                <div className="mt-2 p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Final Reward (with {tierMultiplier}x multiplier):</span>
                    <span
                      className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                      data-testid="text-final-reward"
                    >
                      {finalReward} $STREAM
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {baseReward} × {tierMultiplier} = {finalReward} points
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
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
                <FormLabel className="text-gray-300">Deadline *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'bg-slate-800 border-cyan-500/30 text-white hover:bg-slate-700 justify-start text-left font-normal',
                          !field.value && 'text-gray-500'
                        )}
                        data-testid="button-select-deadline"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-cyan-500/30" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="bg-slate-800 text-white"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags */}
          <div className="space-y-2">
            <FormLabel className="text-gray-300">Tags (Optional)</FormLabel>
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
                className="flex-1 bg-slate-800 border-purple-500/30 text-white focus:border-purple-500"
                disabled={tags.length >= 5}
                data-testid="input-bounty-tag"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-500/10"
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
                    className="border-purple-500/50 text-purple-300"
                    data-testid={`tag-${tag}`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-purple-100"
                      data-testid={`button-remove-tag-${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">{tags.length}/5 tags added</p>
          </div>

          {/* Form Error Display */}
          {form.formState.errors.root && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-300" data-testid="text-form-error">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-cyan-500/20">
            <Button
              type="submit"
              disabled={createBounty.isPending}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              data-testid="button-submit-bounty"
            >
              {createBounty.isPending ? (
                'Creating Bounty...'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bounty ({finalReward} $STREAM)
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
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
          </div>
        </form>
      </Form>
    </div>
  );
}
