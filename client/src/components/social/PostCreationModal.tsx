import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MessageCircle, Sparkles, X } from 'lucide-react';

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
        title: 'Failed to create post',
        description: error.message || 'Something went wrong',
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
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-purple-500/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30">
              <MessageCircle className="w-5 h-5 text-fuchsia-400" />
            </div>
            Create a Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="post-title" className="text-gray-300 mb-2 block">
              Title
            </Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-white/5 border-purple-500/30 focus:border-fuchsia-500/50 text-white placeholder:text-gray-500"
              maxLength={200}
              data-testid="input-post-title"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {title.length}/200
            </div>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="post-content" className="text-gray-300 mb-2 block">
              Content
            </Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, analysis, or insights..."
              className="bg-white/5 border-purple-500/30 focus:border-fuchsia-500/50 text-white placeholder:text-gray-500 min-h-[200px] resize-none"
              maxLength={5000}
              data-testid="input-post-content"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {content.length}/5000
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="post-tags" className="text-gray-300 mb-2 block">
              Tags <span className="text-gray-500 text-xs">(optional, comma-separated)</span>
            </Label>
            <Input
              id="post-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="DeFi, Layer2, NFT"
              className="bg-white/5 border-purple-500/30 focus:border-fuchsia-500/50 text-white placeholder:text-gray-500"
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
                    className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300"
                  >
                    #{trimmedTag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-purple-500/30 hover:border-fuchsia-500/50 text-gray-300"
              data-testid="button-cancel-post"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || !title.trim() || !content.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 disabled:opacity-50"
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
      </DialogContent>
    </Dialog>
  );
}
