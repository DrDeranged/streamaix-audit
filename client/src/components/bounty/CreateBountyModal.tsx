import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useBounties } from '@/hooks/useBounties';
import { cn } from '@/lib/utils';

const createBountySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(1000, 'Description too long'),
  reward: z.number().min(1, 'Reward must be at least 1 $STREAM').max(10000, 'Reward too high'),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
});

type CreateBountyFormData = z.infer<typeof createBountySchema>;

interface CreateBountyModalProps {
  onSuccess?: () => void;
}

export default function CreateBountyModal({ onSuccess }: CreateBountyModalProps) {
  const { createBounty } = useBounties();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<CreateBountyFormData>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      title: '',
      description: '',
      reward: 100,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const onSubmit = async (data: CreateBountyFormData) => {
    await createBounty.mutateAsync({
      ...data,
      tags,
    });
    
    form.reset();
    setTags([]);
    onSuccess?.();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
          Create New Bounty
        </h2>
        <p className="text-sm text-gray-400">
          Offer $STREAM tokens to creators who transform your requested content into summaries
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

          {/* Reward Amount */}
          <FormField
            control={form.control}
            name="reward"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Reward Amount ($STREAM) *</FormLabel>
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
                <p className="text-xs text-gray-400 mt-1">
                  You'll need to approve this amount of $STREAM tokens
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
                  Create Bounty
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> Creating a bounty requires two transactions:
              <br />
              1. Approve $STREAM token transfer
              <br />
              2. Create bounty on the blockchain
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
