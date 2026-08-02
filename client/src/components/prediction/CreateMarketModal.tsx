import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';

const createMarketSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters').max(200, 'Question must be less than 200 characters'),
  description: z.string().optional(),
  category: z.enum(['crypto', 'defi', 'real_world', 'community']),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
  initialLiquidity: z.number().min(100, 'Minimum liquidity is 100 STREAM').max(100000, 'Maximum liquidity is 100,000 STREAM'),
  tags: z.string().optional(),
});

type CreateMarketFormData = z.infer<typeof createMarketSchema>;

interface CreateMarketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMarketModal({ open, onOpenChange }: CreateMarketModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<CreateMarketFormData>({
    resolver: zodResolver(createMarketSchema),
    defaultValues: {
      question: '',
      description: '',
      category: 'crypto',
      initialLiquidity: 1000,
      tags: '',
    },
  });

  const createMarketMutation = useMutation({
    mutationFn: async (data: CreateMarketFormData) => {
      const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      
      const response = await apiRequest('/api/prediction-markets', {
        method: 'POST',
        body: JSON.stringify({
          question: data.question,
          description: data.description,
          category: data.category,
          deadline: data.deadline.toISOString(),
          initialLiquidity: data.initialLiquidity,
          resolutionSource: 'oracle',
          tags,
        }),
      });
      
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Market Created!',
        description: 'Your prediction market has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets'] });
      form.reset();
      onOpenChange(false);
      
      // Redirect to the new market if we have the ID
      if (data?.market?.id) {
        setLocation(`/markets/${data.market.id}`);
      }
    },
    onError: (error: any) => {
      if (error.message?.includes('409')) {
        toast({
          title: 'Market Already Exists',
          description: 'A market with this question already exists. Try searching for it on the markets page.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Unable to create market',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    },
  });

  const onSubmit = (data: CreateMarketFormData) => {
    createMarketMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl border border-ink-edge bg-ink-surface text-body">
        <DialogHeader>
          <DialogTitle asChild>
            <SectionTitle as="h2">Create Prediction Market</SectionTitle>
          </DialogTitle>
          <DialogDescription className="text-secondary">
            Create a new prediction market and let the community trade on future outcomes.
          </DialogDescription>
        </DialogHeader>

        <Surface variant="raised" className="border border-ink-edge/60 p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Market Question</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Will Bitcoin reach $150,000 by end of 2025?"
                      className="rounded-xl border-ink-edge bg-ink-surface text-primary placeholder:text-muted focus-visible:ring-accent-core"
                      data-testid="input-market-question"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted">
                    Ask a clear yes/no question about a future event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add context, resolution criteria, and any important details..."
                      className="min-h-[80px] rounded-xl border-ink-edge bg-ink-surface text-primary placeholder:text-muted focus-visible:ring-accent-core"
                      data-testid="input-market-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-ink-edge bg-ink-surface text-primary focus:ring-accent-core" data-testid="select-market-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-ink-edge bg-ink-raised text-primary">
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="defi">DeFi</SelectItem>
                        <SelectItem value="real_world">Real World</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-primary">Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full rounded-xl border-ink-edge bg-ink-surface text-primary hover:bg-ink-raised hover:text-primary',
                              !field.value && 'text-muted'
                            )}
                            data-testid="button-select-deadline"
                          >
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                       <PopoverContent className="w-auto rounded-xl border border-ink-edge bg-ink-raised p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                           className="bg-ink-raised text-primary"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="initialLiquidity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Initial Liquidity (STREAM)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                       className="rounded-xl border-ink-edge bg-ink-surface text-primary placeholder:text-muted focus-visible:ring-accent-core tabular"
                      data-testid="input-initial-liquidity"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                   <FormDescription className="text-xs text-muted">
                    Minimum 100 STREAM required to create a market
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="bitcoin, price, prediction (comma separated)"
                       className="rounded-xl border-ink-edge bg-ink-surface text-primary placeholder:text-muted focus-visible:ring-accent-core"
                      data-testid="input-market-tags"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription className="text-xs text-muted">
                    Add tags separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                 className="flex-1 rounded-xl border-ink-edge bg-ink-surface text-primary hover:bg-ink-raised hover:text-primary"
                disabled={createMarketMutation.isPending}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                 className="grad-accent glow-accent flex-1 rounded-xl text-primary hover:bg-accent-deep"
                disabled={createMarketMutation.isPending}
                data-testid="button-submit-create"
              >
                {createMarketMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Market
                  </>
                )}
              </Button>
             </div>
           </form>
         </Form>
       </Surface>
      </DialogContent>
    </Dialog>
  );
}
