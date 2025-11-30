import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FollowButtonProps {
  avatarId: string;
  avatarName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  className?: string;
}

export function FollowButton({ 
  avatarId, 
  avatarName,
  variant = "default",
  size = "default",
  showIcon = true,
  className = ""
}: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is following this avatar
  const { data: followStatus, isLoading } = useQuery<{ isFollowing: boolean }>({
    queryKey: ['/api/avatars', avatarId, 'follow-status'],
    enabled: !!user,
  });

  const isFollowing = followStatus?.isFollowing || false;

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      if (isFollowing) {
        return apiRequest(`/api/avatars/${avatarId}/unfollow`, {
          method: 'DELETE',
        });
      } else {
        return apiRequest(`/api/avatars/${avatarId}/follow`, {
          method: 'POST',
        });
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/avatars', avatarId, 'follow-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/avatars/followed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard'] });
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You unfollowed ${avatarName || 'this entrepreneur'}` 
          : `You are now following ${avatarName || 'this entrepreneur'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow entrepreneurs",
        variant: "destructive",
      });
      return;
    }

    followMutation.mutate();
  };

  const baseClassName = isFollowing 
    ? "relative bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
    : "relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-0 text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-slate-900/60";

  return (
    <div className={`relative group inline-block ${className}`}>
      {/* Gradient border glow */}
      {!isFollowing && (
        <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500 opacity-70 group-hover:opacity-100 blur-[1px] transition-opacity duration-300" />
      )}
      <Button
        onClick={handleClick}
        disabled={isLoading || followMutation.isPending}
        variant="ghost"
        size={size}
        className={`${baseClassName} transition-all duration-300 overflow-hidden`}
        data-testid={`button-follow-${avatarId}`}
      >
        {/* Shimmer effect */}
        {!isFollowing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        )}
        {showIcon && (
          isFollowing ? (
            <UserCheck className="w-4 h-4 mr-2 text-emerald-500" />
          ) : (
            <UserPlus className="w-4 h-4 mr-2 text-emerald-500" />
          )
        )}
        <span className="relative z-10 font-medium">
          {followMutation.isPending ? "..." : isFollowing ? "Following" : "Follow"}
        </span>
      </Button>
    </div>
  );
}
