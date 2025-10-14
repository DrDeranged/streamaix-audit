import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface TrackEngagementParams {
  bountyId: string;
  type: 'view' | 'share' | 'like';
}

export function useEngagement(bountyId: string) {
  // Track view automatically when hook is used
  useEffect(() => {
    if (bountyId) {
      // Track view after a 2 second delay to ensure it's a real view
      const timer = setTimeout(() => {
        trackEngagement({ bountyId, type: 'view' });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [bountyId]);

  const trackEngagement = async (params: TrackEngagementParams) => {
    try {
      await apiRequest(`/api/bounties/${params.bountyId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: params.type }),
      });
      
      // Invalidate engagement data to refresh
      queryClient.invalidateQueries({ 
        queryKey: ['/api/bounties', params.bountyId, 'engagement'] 
      });
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  };

  const trackLike = useMutation({
    mutationFn: () => trackEngagement({ bountyId, type: 'like' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/bounties', bountyId, 'engagement'] 
      });
    },
  });

  const trackShare = useMutation({
    mutationFn: () => trackEngagement({ bountyId, type: 'share' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/bounties', bountyId, 'engagement'] 
      });
    },
  });

  return {
    trackLike,
    trackShare,
  };
}
