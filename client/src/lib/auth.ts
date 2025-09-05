import { apiRequest } from './queryClient';

export interface User {
  id: string;
  username: string;
  email?: string;
  walletAddress?: string;
  ensName?: string;
  avatar?: string;
  bio?: string;
  // Twitter OAuth fields
  twitterId?: string;
  twitterUsername?: string;
  twitterDisplayName?: string;
  twitterVerified?: boolean;
  authProvider?: string;
  createdAt?: string;
}

export interface UserStats {
  summariesCount: number;
  bountiesCount: number;
  interactionsCount: number;
  stacksCount: number;
}

export interface AuthState {
  user: User | null;
  stats: UserStats | null;
  token: string | null;
}

// Token management
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

export const disconnectWallet = async () => {
  const response = await apiRequest('/api/auth/disconnect-wallet', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return response;
};

export const clearAllUserData = () => {
  localStorage.clear();
  sessionStorage.clear();
};

// Auth API functions
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response;
  },

  register: async (userData: {
    username: string;
    password: string;
    confirmPassword: string;
    email?: string;
    walletAddress?: string;
    ensName?: string;
    avatar?: string;
    bio?: string;
  }) => {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response;
  },

  walletLogin: async (walletAddress: string, signature: string, message: string) => {
    const response = await apiRequest('/api/auth/wallet-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, signature, message }),
    });
    return response;
  },

  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await apiRequest('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      // If token is invalid, remove it
      removeAuthToken();
      throw error;
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const response = await apiRequest('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    return response;
  },

  disconnectWallet: async () => {
    const response = await apiRequest('/api/auth/disconnect-wallet', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response;
  },

  logout: () => {
    removeAuthToken();
  },
};

// Helper to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};