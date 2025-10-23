import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, setAuthToken, removeAuthToken, type User, type UserStats } from '@/lib/auth';
import { useToast } from './use-toast';

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: data?.user as User | null,
    stats: data?.stats as UserStats | null,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(['auth', 'current-user'], data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({
        title: 'Welcome back!',
        description: `Successfully logged in as ${data.user.username}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userData: {
      username: string;
      password: string;
      confirmPassword: string;
      email?: string;
      walletAddress?: string;
      ensName?: string;
      avatar?: string;
      bio?: string;
    }) => authApi.register(userData),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(['auth', 'current-user'], data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({
        title: 'Account created!',
        description: `Welcome to StreamAiX, ${data.user.username}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    },
  });
}

export function useWalletLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ walletAddress, signature, message }: {
      walletAddress: string;
      signature: string;
      message: string;
    }) => authApi.walletLogin(walletAddress, signature, message),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(['auth', 'current-user'], data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({
        title: 'Wallet connected!',
        description: `Welcome, ${data.user.username}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Wallet login failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    },
  });
}

export function useTwitterLogin() {
  const { toast } = useToast();

  const initiateTwitterLogin = () => {
    // Redirect to Twitter OAuth URL
    window.location.href = '/api/auth/twitter';
  };

  const handleTwitterCallback = (token: string) => {
    setAuthToken(token);
    toast({
      title: 'Twitter login successful!',
      description: 'Welcome to StreamAiX!',
    });
  };

  return {
    initiateTwitterLogin,
    handleTwitterCallback,
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (updates: Partial<User>) => authApi.updateProfile(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'current-user'], (old: any) => ({
        ...old,
        user: data.user,
      }));
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => {
      authApi.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      removeAuthToken();
      // Remove auth data first
      queryClient.setQueryData(['auth', 'current-user'], null);
      // Then invalidate other queries gracefully instead of clearing everything
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['user'] });
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    },
  });
}

export function useDisconnectWallet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => authApi.disconnectWallet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({
        title: 'Wallet disconnected',
        description: 'Your wallet has been successfully disconnected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Disconnect failed',
        description: error.message || 'Failed to disconnect wallet',
        variant: 'destructive',
      });
    },
  });
}

export function useClearBrowserData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => {
      localStorage.clear();
      sessionStorage.clear();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: 'Browser data cleared',
        description: 'All browser data has been cleared. Redirecting...',
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    },
  });
}