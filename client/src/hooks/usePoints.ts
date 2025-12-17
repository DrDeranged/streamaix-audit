import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

interface PointsStats {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  streak: number;
  longestStreak: number;
  transactionCount: number;
}

interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  source: string;
  referenceId?: string;
  referenceType?: string;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface PointsHistoryResponse {
  success: boolean;
  transactions: PointsTransaction[];
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface DailyLoginResponse {
  success: boolean;
  pointsAwarded: number;
  streak: number;
  isNewLogin: boolean;
}

export function usePointsBalance() {
  const { isAuthenticated } = useAuth();

  return useQuery<PointsStats>({
    queryKey: ['/api/points/balance'],
    enabled: isAuthenticated,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function usePointsHistory(limit = 50, offset = 0) {
  const { isAuthenticated } = useAuth();

  return useQuery<PointsHistoryResponse>({
    queryKey: ['/api/points/history', limit, offset],
    queryFn: async () => {
      const response = await fetch(`/api/points/history?limit=${limit}&offset=${offset}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch points history');
      return response.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useRecentActivity(hours = 24) {
  const { isAuthenticated } = useAuth();

  return useQuery<{ success: boolean; transactions: PointsTransaction[] }>({
    queryKey: ['/api/points/recent', hours],
    queryFn: async () => {
      const response = await fetch(`/api/points/recent?hours=${hours}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      return response.json();
    },
    enabled: isAuthenticated,
  });
}

export function useDailyLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<DailyLoginResponse, Error>({
    mutationFn: async () => {
      return apiRequest('/api/points/daily-login', { method: 'POST' });
    },
    onSuccess: (data) => {
      if (data.isNewLogin && data.pointsAwarded > 0) {
        toast({
          title: `+${data.pointsAwarded} STREAM Points!`,
          description: `Daily login bonus (${data.streak} day streak)`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/points/balance'] });
      }
    },
  });
}

export function useAwardStreamWatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ success: boolean; pointsAwarded: number }, Error, { streamId: string; minutesWatched: number }>({
    mutationFn: async ({ streamId, minutesWatched }) => {
      return apiRequest('/api/points/stream-watch', { 
        method: 'POST',
        body: JSON.stringify({ streamId, minutesWatched })
      });
    },
    onSuccess: (data) => {
      if (data.pointsAwarded > 0) {
        toast({
          title: `+${data.pointsAwarded} STREAM Points`,
          description: 'Earned for watching the stream',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/points/balance'] });
      }
    },
  });
}

export function useAwardVoiceConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ success: boolean; pointsAwarded: number }, Error, { streamId: string }>({
    mutationFn: async ({ streamId }) => {
      return apiRequest('/api/points/voice-conversation', { 
        method: 'POST',
        body: JSON.stringify({ streamId })
      });
    },
    onSuccess: (data) => {
      if (data.pointsAwarded > 0) {
        toast({
          title: `+${data.pointsAwarded} STREAM Points`,
          description: 'Bonus for voice conversation',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/points/balance'] });
      }
    },
  });
}

export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toLocaleString();
}

export function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    signup: '🎉',
    daily_login: '📅',
    bounty_submit: '📝',
    bounty_accepted: '✅',
    prediction_win: '🎯',
    stream_watch: '📺',
    voice_conversation: '🎤',
    referral: '👥',
    profile_complete: '👤',
    tip_sent: '💸',
    tip_received: '💰',
    market_trade: '📊',
  };
  return icons[source] || '⚡';
}

export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    signup: 'Welcome Bonus',
    daily_login: 'Daily Login',
    bounty_submit: 'Bounty Submission',
    bounty_accepted: 'Bounty Accepted',
    prediction_win: 'Prediction Win',
    stream_watch: 'Stream Watching',
    voice_conversation: 'Voice Conversation',
    referral: 'Referral Bonus',
    profile_complete: 'Profile Complete',
    tip_sent: 'Tip Sent',
    tip_received: 'Tip Received',
    market_trade: 'Market Trade',
    admin_adjustment: 'Adjustment',
  };
  return labels[source] || source;
}
