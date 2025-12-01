import { QueryClient, QueryFunction } from "@tanstack/react-query";

const friendlyErrorMessages: Record<string, string> = {
  'Invalid credentials': 'Username or password is incorrect. Please try again.',
  'Authentication required': 'Please sign in to continue.',
  'Access token required': 'Your session has expired. Please sign in again.',
  'Invalid or expired token': 'Your session has expired. Please sign in again.',
  'Admin access required': 'You don\'t have permission to access this feature.',
  'Username already exists': 'This username is already taken. Please choose another.',
  'Wallet address already registered': 'This wallet is already connected to another account.',
  'Invalid referral code': 'The referral code you entered is not valid.',
  'Referral code is inactive': 'This referral code is no longer active.',
  'Password is required': 'Please enter a password.',
  'User not found': 'We couldn\'t find an account with that username.',
  'Summary not found': 'This summary no longer exists.',
  'Bounty not found': 'This bounty no longer exists.',
  'Market not found': 'This market no longer exists.',
  'Proposal not found': 'This proposal no longer exists.',
  'You can only edit your own summaries': 'You can only edit content you created.',
  'You can only delete your own summaries': 'You can only delete content you created.',
  'You can only edit your own bounties': 'You can only edit bounties you created.',
  'Only bounty creator can mark as complete': 'Only the bounty creator can approve submissions.',
  'Bounty is not available for claiming': 'This bounty is no longer available.',
  'Bounty is not in claimable/in-progress state': 'This bounty cannot be completed at this time.',
  'Cannot tip a completed or expired bounty': 'You can\'t tip a bounty that\'s already finished.',
  'Insufficient balance': 'You don\'t have enough STREAM for this action.',
  'Insufficient shares': 'You don\'t have enough shares to sell.',
  'Market is closed': 'This market is no longer accepting trades.',
  'Market is not active': 'This market is not currently trading.',
  'Voting is closed for this proposal': 'Voting has ended for this proposal.',
  'Invalid vote support value': 'Please select a valid voting option.',
  'Email already registered on waitlist': 'This email is already on the waitlist.',
  'Unsubscribe token is required': 'Invalid unsubscribe link. Please try again.',
  'Email is required': 'Please enter your email address.',
  'Title and description are required': 'Please fill in all required fields.',
  'Invalid subscription data': 'Unable to save your notification preferences. Please try again.',
  'Endpoint required': 'Unable to set up notifications. Please try again.',
  'Failed to register': 'Registration failed. Please check your details and try again.',
  'Failed to update': 'Update failed. Please try again.',
  'Network error': 'Unable to connect. Please check your internet connection.',
  'Rate limit exceeded': 'Too many requests. Please wait a moment and try again.',
  'Internal Server Error': 'Something went wrong. Please try again later.',
  'Bad Request': 'Invalid request. Please check your input and try again.',
  'Not Found': 'The requested resource was not found.',
  'Forbidden': 'You don\'t have permission for this action.',
  'Unauthorized': 'Please sign in to continue.',
};

function getFriendlyErrorMessage(rawMessage: string, statusCode?: number): string {
  const cleanMessage = rawMessage.replace(/^\d+:\s*/, '');
  
  if (friendlyErrorMessages[cleanMessage]) {
    return friendlyErrorMessages[cleanMessage];
  }
  
  for (const [key, friendly] of Object.entries(friendlyErrorMessages)) {
    if (cleanMessage.toLowerCase().includes(key.toLowerCase())) {
      return friendly;
    }
  }
  
  if (statusCode === 401) {
    return 'Please sign in to continue.';
  }
  if (statusCode === 403) {
    return 'You don\'t have permission for this action.';
  }
  if (statusCode === 404) {
    return 'The requested item was not found.';
  }
  if (statusCode === 409) {
    return 'This action conflicts with existing data.';
  }
  if (statusCode === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (statusCode && statusCode >= 500) {
    return 'Something went wrong on our end. Please try again later.';
  }
  
  if (cleanMessage.length > 100 || /^[A-Z_]+$/.test(cleanMessage) || cleanMessage.includes('Error:')) {
    return 'Something went wrong. Please try again.';
  }
  
  return cleanMessage;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const friendlyMessage = getFriendlyErrorMessage(text, res.status);
    throw new Error(friendlyMessage);
  }
}

export async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const authToken = localStorage.getItem('auth_token');
  
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { "Authorization": `Bearer ${authToken}` }),
      ...options.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
    }
    const friendlyMessage = getFriendlyErrorMessage(errorMessage, res.status);
    throw new Error(friendlyMessage);
  }

  return res.json();
}

export { getFriendlyErrorMessage };

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token from localStorage if available
    const authToken = localStorage.getItem('auth_token');
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        ...(authToken && { "Authorization": `Bearer ${authToken}` }),
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes - increased for better performance
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection (renamed from cacheTime in v5)
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors
        if (error?.message?.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => 
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
