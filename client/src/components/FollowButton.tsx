import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface FollowUserButtonProps {
  userId: string;
  username?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'compact';
  showLabel?: boolean;
  className?: string;
}

export function FollowUserButton({ 
  userId, 
  username,
  variant = 'default',
  showLabel = true,
  className 
}: FollowUserButtonProps) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: followStatus, isLoading: checkingStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: ['/api/users', userId, 'follow', 'status'],
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'follow'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me/followed-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties/following'] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/users/${userId}/follow`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'follow'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me/followed-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties/following'] });
    },
  });

  const isFollowing = followStatus?.isFollowing;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (checkingStatus) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "tap-target p-2 rounded-full transition-all inline-flex items-center justify-center",
          isFollowing 
            ? "bg-emerald-500/20 text-emerald-400 hover:bg-red-500/20 hover:text-red-400" 
            : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid={`follow-user-${userId}`}
      >
        <AnimatePresence mode="wait">
          {isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 180 }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Check className="w-4 h-4 text-emerald-400" />
            </motion.div>
          ) : isFollowing ? (
            <motion.div
              key="following"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UserMinus className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="notFollowing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UserPlus className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        className={cn(
          "tap-target gap-2 transition-all",
          isFollowing 
            ? "border-emerald-500/50 text-emerald-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10" 
            : "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white",
          className
        )}
        data-testid={`follow-user-${userId}`}
      >
        <AnimatePresence mode="wait">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : showSuccess ? (
            <Check className="w-4 h-4" />
          ) : isFollowing ? (
            <UserMinus className="w-4 h-4" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
        </AnimatePresence>
        {showLabel && (
          <span>
            {isPending ? 'Loading...' : showSuccess ? 'Followed!' : isFollowing ? 'Unfollow' : 'Follow'}
          </span>
        )}
      </Button>
    </motion.div>
  );
}

interface FollowCategoryButtonProps {
  category: string;
  variant?: 'default' | 'outline' | 'ghost' | 'pill';
  showLabel?: boolean;
  className?: string;
}

export function FollowCategoryButton({ 
  category,
  variant = 'default',
  showLabel = true,
  className 
}: FollowCategoryButtonProps) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: followStatus, isLoading: checkingStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: ['/api/categories', category, 'follow', 'status'],
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/categories/${encodeURIComponent(category)}/follow`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', category, 'follow'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me/followed-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bounty-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties/following'] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/categories/${encodeURIComponent(category)}/follow`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', category, 'follow'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me/followed-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bounty-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties/following'] });
    },
  });

  const isFollowing = followStatus?.isFollowing;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (checkingStatus) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (variant === 'pill') {
    return (
      <motion.button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "tap-target px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
          isFollowing 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40" 
            : "bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30",
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        data-testid={`follow-category-${category}`}
      >
        <AnimatePresence mode="wait">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : showSuccess ? (
            <Check className="w-3.5 h-3.5" />
          ) : isFollowing ? (
            <BellOff className="w-3.5 h-3.5" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}
        </AnimatePresence>
        <span>{category}</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        className={cn(
          "tap-target gap-2 transition-all",
          isFollowing 
            ? "border-emerald-500/50 text-emerald-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10" 
            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white",
          className
        )}
        data-testid={`follow-category-${category}`}
      >
        <AnimatePresence mode="wait">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : showSuccess ? (
            <Check className="w-4 h-4" />
          ) : isFollowing ? (
            <BellOff className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </AnimatePresence>
        {showLabel && (
          <span>
            {isPending ? 'Loading...' : showSuccess ? 'Following!' : isFollowing ? 'Unfollow' : `Follow ${category}`}
          </span>
        )}
      </Button>
    </motion.div>
  );
}
