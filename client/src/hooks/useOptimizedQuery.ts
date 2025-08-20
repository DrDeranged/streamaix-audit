// Optimized React Query hooks with performance monitoring
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

// Performance tracking
const queryPerformance = new Map<string, { count: number; totalTime: number; errors: number }>();

function trackQueryPerformance(queryKey: string, duration: number, success: boolean) {
  const existing = queryPerformance.get(queryKey) || { count: 0, totalTime: 0, errors: 0 };
  
  queryPerformance.set(queryKey, {
    count: existing.count + 1,
    totalTime: existing.totalTime + duration,
    errors: existing.errors + (success ? 0 : 1),
  });
}

// Optimized query hook with background updates
export function useOptimizedQuery<T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> & {
    backgroundUpdate?: boolean;
    cacheTime?: number;
    staleTime?: number;
  } = {}
) {
  const keyString = queryKey.join('.');
  
  const optimizedQueryFn = useCallback(async () => {
    const start = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - start;
      trackQueryPerformance(keyString, duration, true);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      trackQueryPerformance(keyString, duration, false);
      throw error;
    }
  }, [queryFn, keyString]);

  return useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    cacheTime: options.cacheTime ?? 10 * 60 * 1000, // 10 minutes default
    refetchInterval: options.backgroundUpdate ? 30000 : false, // 30s background updates
    refetchIntervalInBackground: options.backgroundUpdate,
    ...options,
  });
}

// Web3 specific query hook with retry logic
export function useWeb3Query<T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    chainId?: number;
    backgroundUpdate?: boolean;
    retryOnChainChange?: boolean;
  } = {}
) {
  return useOptimizedQuery(
    [...queryKey, options.chainId],
    queryFn,
    {
      enabled: options.enabled,
      backgroundUpdate: options.backgroundUpdate,
      retry: (failureCount, error: any) => {
        // Don't retry on user rejection or insufficient funds
        if (error?.code === 4001 || error?.code === -32603) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 30 * 1000, // 30 seconds for Web3 data
      cacheTime: 2 * 60 * 1000, // 2 minutes cache
    }
  );
}

// Portfolio data hook with multi-chain aggregation
export function usePortfolioQuery(
  address: string,
  chainIds: number[],
  options: { enabled?: boolean; backgroundUpdate?: boolean } = {}
) {
  return useOptimizedQuery(
    ['portfolio', address, ...chainIds],
    async () => {
      // This would integrate with the optimized Web3 manager
      const { optimizedWeb3 } = await import('@/lib/optimized-web3');
      return optimizedWeb3.getMultiChainBalances(address, chainIds);
    },
    {
      enabled: options.enabled && !!address && chainIds.length > 0,
      backgroundUpdate: options.backgroundUpdate ?? true,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

// Optimized mutation with automatic cache invalidation
export function useOptimizedMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, Error, V> & {
    invalidateQueries?: (string | number)[][];
    optimisticUpdate?: {
      queryKey: (string | number)[];
      updateFn: (oldData: any, variables: V) => any;
    };
  } = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Optimistic update
      if (options.optimisticUpdate) {
        await queryClient.cancelQueries({ queryKey: options.optimisticUpdate.queryKey });
        
        const previousData = queryClient.getQueryData(options.optimisticUpdate.queryKey);
        
        queryClient.setQueryData(
          options.optimisticUpdate.queryKey,
          (old: any) => options.optimisticUpdate!.updateFn(old, variables)
        );
        
        return { previousData };
      }
      
      return options.onMutate?.(variables);
    },
    onError: (error, variables, context: any) => {
      // Rollback optimistic update
      if (options.optimisticUpdate && context?.previousData !== undefined) {
        queryClient.setQueryData(options.optimisticUpdate.queryKey, context.previousData);
      }
      
      options.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      options.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after mutation settles
      if (options.optimisticUpdate) {
        queryClient.invalidateQueries({ queryKey: options.optimisticUpdate.queryKey });
      }
      
      options.onSettled?.(data, error, variables, context);
    },
  });
}

// Background data sync hook
export function useBackgroundSync(queryKeys: (string | number)[][], interval: number = 30000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncInterval = setInterval(() => {
      queryKeys.forEach(queryKey => {
        queryClient.refetchQueries({ queryKey, type: 'active' });
      });
    }, interval);

    return () => clearInterval(syncInterval);
  }, [queryClient, queryKeys, interval]);
}

// Query performance monitoring hook
export function useQueryPerformance() {
  return useMemo(() => {
    const metrics = Array.from(queryPerformance.entries()).map(([key, data]) => ({
      queryKey: key,
      averageTime: data.totalTime / data.count,
      totalCalls: data.count,
      errorRate: (data.errors / data.count) * 100,
      ...data,
    }));

    return {
      metrics,
      slowestQueries: metrics
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 10),
      mostErrorProne: metrics
        .filter(m => m.errorRate > 0)
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 10),
      totalQueries: metrics.reduce((sum, m) => sum + m.totalCalls, 0),
      totalErrors: metrics.reduce((sum, m) => sum + m.errors, 0),
    };
  }, []);
}

// Prefetch hook for better UX
export function usePrefetch() {
  const queryClient = useQueryClient();

  return useCallback((queryKey: (string | number)[], queryFn: () => Promise<any>) => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);
}

// Smart cache invalidation
export function useSmartCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidatePortfolio: useCallback((address: string) => {
      queryClient.invalidateQueries({ 
        queryKey: ['portfolio', address],
        type: 'all'
      });
    }, [queryClient]),

    invalidateWeb3Data: useCallback((chainId?: number) => {
      const filters = chainId 
        ? { predicate: (query: any) => query.queryKey.includes(chainId) }
        : { type: 'all' as const };
        
      queryClient.invalidateQueries(filters);
    }, [queryClient]),

    invalidateUserData: useCallback((userId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['user', userId],
        type: 'all'
      });
    }, [queryClient]),

    clearCache: useCallback(() => {
      queryClient.clear();
    }, [queryClient]),
  };
}