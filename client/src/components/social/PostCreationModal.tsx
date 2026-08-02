import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Surface from '@/components/ds/Surface';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MessageCircle, Sparkles } from 'lucide-react';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostCreationModal({ isOpen, onClose }: PostCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const createPostMutation = useMutation({
    mutationFn: (data: { title: string; content: string; tags?: string[] }) =>
      apiRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Post created!',
        description: 'Your post has been published successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setTitle('');
      setContent('');
      setTags('');
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to create post',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your post',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter some content for your post',
        variant: 'destructive',
      });
      return;
    }

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl border border-ink-edge bg-ink-surface p-0 text-primary shadow-2xl">
        <Surface className="rounded-2xl border-0 p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl text-primary">
              <div className="rounded-xl border border-accent-core/30 bg-accent-core/10 p-2">
                <MessageCircle className="h-5 w-5 text-accent-bright" />
              </div>
              Create a Post
            </DialogTitle>
          </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="post-title" className="mb-2 block text-secondary">
              Title
            </Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="rounded-xl border-ink-edge bg-ink-raised text-primary placeholder:text-muted focus:border-accent-core focus:ring-accent-core/20"
              maxLength={200}
              data-testid="input-post-title"
            />
            <div className="mt-1 text-right text-xs text-muted">
              {title.length}/200
            </div>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="post-content" className="mb-2 block text-secondary">
              Content
            </Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, analysis, or insights..."
              className="min-h-[200px] resize-none rounded-xl border-ink-edge bg-ink-raised text-primary placeholder:text-muted focus:border-accent-core focus:ring-accent-core/20"
              maxLength={5000}
              data-testid="input-post-content"
            />
            <div className="mt-1 text-right text-xs text-muted">
              {content.length}/5000
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="post-tags" className="mb-2 block text-secondary">
              Tags <span className="text-xs text-muted">(optional, comma-separated)</span>
            </Label>
            <Input
              id="post-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="DeFi, Layer2, NFT"
              className="rounded-xl border-ink-edge bg-ink-raised text-primary placeholder:text-muted focus:border-accent-core focus:ring-accent-core/20"
              data-testid="input-post-tags"
            />
          </div>

          {/* Tags Preview */}
          {tags && (
            <div className="flex gap-2 flex-wrap">
              {tags.split(',').map((tag, index) => {
                const trimmedTag = tag.trim();
                if (!trimmedTag) return null;
                return (
                  <span
                    key={index}
                    className="rounded-xl border border-accent-core/30 bg-accent-core/10 px-3 py-1 text-sm text-accent-bright"
                  >
                    #{trimmedTag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-ink-divider pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-xl border-ink-edge bg-ink-surface text-secondary hover:bg-ink-raised hover:text-primary"
              data-testid="button-cancel-post"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || !title.trim() || !content.trim()}
              className="grad-accent glow-accent flex-1 rounded-xl text-primary hover:bg-accent-deep disabled:opacity-50"
              data-testid="button-submit-post"
            >
              {createPostMutation.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Publish Post
                </>
              )}
            </Button>
          </div>
        </div>
        </Surface>
      </DialogContent>
    </Dialog>
  );
}
