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

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || followMutation.isPending}
      variant={isFollowing ? "outline" : variant}
      size={size}
      className={className}
      data-testid={`button-follow-${avatarId}`}
    >
      {showIcon && (
        isFollowing ? (
          <UserCheck className="w-4 h-4 mr-2" />
        ) : (
          <UserPlus className="w-4 h-4 mr-2" />
        )
      )}
      {followMutation.isPending ? "..." : isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
