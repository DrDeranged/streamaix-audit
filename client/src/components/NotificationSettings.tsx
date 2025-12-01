import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, BellOff, Smartphone, Check, X, Send, LogIn, Bug, AlertTriangle, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationPreferences {
  marketResolutions: boolean;
  priceAlerts: boolean;
  bountyUpdates: boolean;
  tradeConfirmations: boolean;
  aiAgentActivity: boolean;
  weeklyDigest: boolean;
  morningBriefing: boolean;
  eveningRecap: boolean;
  marketMovers: boolean;
  macroAlerts: boolean;
  breakingNews: boolean;
  coindeskNews: boolean;
  tradingMetrics: boolean;
  whaleAlerts: boolean;
  liquidationAlerts: boolean;
  fundingRateAlerts: boolean;
}

interface DiagnosticStep {
  step: string;
  status: 'success' | 'failed' | 'pending' | 'checking';
  details: string;
}

interface DebugInfo {
  swSupported: boolean;
  swRegistered: boolean;
  swActive: boolean;
  pushManagerSupported: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  hasSubscription: boolean;
  subscriptionEndpoint: string | null;
  isIOS: boolean;
  isPWA: boolean;
  browserInfo: string;
}

export function NotificationSettings() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [diagnosticSteps, setDiagnosticSteps] = useState<DiagnosticStep[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    marketResolutions: true,
    priceAlerts: true,
    bountyUpdates: true,
    tradeConfirmations: true,
    aiAgentActivity: false,
    weeklyDigest: true,
    morningBriefing: true,
    eveningRecap: true,
    marketMovers: true,
    macroAlerts: true,
    breakingNews: true,
    coindeskNews: true,
    tradingMetrics: true,
    whaleAlerts: true,
    liquidationAlerts: true,
    fundingRateAlerts: true,
  });

  const { data: subscriptionsData } = useQuery<{ success: boolean; subscriptions: any[] }>({
    queryKey: ['/api/push/subscriptions'],
    enabled: isSubscribed && isAuthenticated,
  });

  const { data: serverDebugData, refetch: refetchDebug } = useQuery<{ success: boolean; diagnostics: any }>({
    queryKey: ['/api/push/debug'],
    enabled: showDebug && isAuthenticated,
  });

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const steps: DiagnosticStep[] = [];
    
    const addStep = (step: string, status: DiagnosticStep['status'], details: string) => {
      const newStep = { step, status, details };
      steps.push(newStep);
      setDiagnosticSteps([...steps]);
      console.log(`🔔 [Diagnostics] ${step}: ${status} - ${details}`);
    };

    try {
      // Step 1: Check Service Worker support
      addStep('Service Worker Support', 'checking', 'Checking browser support...');
      await new Promise(r => setTimeout(r, 300));
      if ('serviceWorker' in navigator) {
        addStep('Service Worker Support', 'success', 'Browser supports Service Workers');
      } else {
        addStep('Service Worker Support', 'failed', 'Browser does NOT support Service Workers');
        setIsRunningDiagnostics(false);
        return;
      }

      // Step 2: Check SW Registration
      addStep('SW Registration', 'checking', 'Checking if Service Worker is registered...');
      await new Promise(r => setTimeout(r, 300));
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        addStep('SW Registration', 'success', `Found ${registrations.length} registration(s), scope: ${registrations[0].scope}`);
      } else {
        addStep('SW Registration', 'failed', 'No Service Worker registered! SW needs to be registered first.');
        setIsRunningDiagnostics(false);
        return;
      }

      // Step 3: Check SW is active
      addStep('SW Active State', 'checking', 'Checking if Service Worker is active...');
      await new Promise(r => setTimeout(r, 300));
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        addStep('SW Active State', 'success', `Service Worker is active (state: ${registration.active.state})`);
      } else {
        addStep('SW Active State', 'failed', 'Service Worker is not active');
      }

      // Step 4: Check PushManager support
      addStep('PushManager Support', 'checking', 'Checking Push API support...');
      await new Promise(r => setTimeout(r, 300));
      if ('PushManager' in window) {
        addStep('PushManager Support', 'success', 'Browser supports Push API');
      } else {
        addStep('PushManager Support', 'failed', 'Browser does NOT support Push API');
        setIsRunningDiagnostics(false);
        return;
      }

      // Step 5: Check Notification permission
      addStep('Notification Permission', 'checking', 'Checking notification permission...');
      await new Promise(r => setTimeout(r, 300));
      if ('Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'granted') {
          addStep('Notification Permission', 'success', 'Permission GRANTED');
        } else if (permission === 'denied') {
          addStep('Notification Permission', 'failed', 'Permission DENIED - User blocked notifications');
        } else {
          addStep('Notification Permission', 'pending', 'Permission not yet requested (default)');
        }
      } else {
        addStep('Notification Permission', 'failed', 'Notification API not supported');
      }

      // Step 6: Check existing subscription
      addStep('Push Subscription', 'checking', 'Checking for existing push subscription...');
      await new Promise(r => setTimeout(r, 300));
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        const endpoint = existingSub.endpoint;
        const type = endpoint.includes('fcm.googleapis.com') ? 'Chrome/FCM' 
          : endpoint.includes('mozilla') ? 'Firefox'
          : endpoint.includes('apple') ? 'Safari/iOS'
          : 'Unknown';
        addStep('Push Subscription', 'success', `Active subscription found (${type})`);
      } else {
        addStep('Push Subscription', 'pending', 'No active subscription - needs to be created');
      }

      // Step 7: Check VAPID key from server
      addStep('VAPID Key Fetch', 'checking', 'Fetching VAPID public key from server...');
      await new Promise(r => setTimeout(r, 300));
      try {
        const vapidResponse = await fetch('/api/push/vapid-key');
        const vapidData = await vapidResponse.json();
        if (vapidData.vapidPublicKey) {
          addStep('VAPID Key Fetch', 'success', `VAPID key received (${vapidData.vapidPublicKey.substring(0, 20)}...)`);
        } else {
          addStep('VAPID Key Fetch', 'failed', 'Server returned no VAPID key');
        }
      } catch (error: any) {
        addStep('VAPID Key Fetch', 'failed', `Error: ${error.message}`);
      }

      // Step 8: Check iOS/PWA status
      addStep('Platform Check', 'checking', 'Checking platform compatibility...');
      await new Promise(r => setTimeout(r, 300));
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      
      if (isIOS && !isPWA) {
        addStep('Platform Check', 'failed', 'iOS detected but NOT installed as PWA. Add to Home Screen first!');
      } else if (isIOS && isPWA) {
        addStep('Platform Check', 'success', 'iOS PWA - Push notifications should work (iOS 16.4+)');
      } else {
        addStep('Platform Check', 'success', `Platform: ${isIOS ? 'iOS' : 'Desktop/Android'}, PWA: ${isPWA ? 'Yes' : 'No'}`);
      }

    } catch (error: any) {
      addStep('Diagnostics Error', 'failed', error.message);
    }

    setIsRunningDiagnostics(false);
  };

  useEffect(() => {
    const checkSupport = async () => {
      console.log('🔔 [NotificationSettings] Starting support check...');
      
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      
      const debug: DebugInfo = {
        swSupported: 'serviceWorker' in navigator,
        swRegistered: false,
        swActive: false,
        pushManagerSupported: 'PushManager' in window,
        notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
        hasSubscription: false,
        subscriptionEndpoint: null,
        isIOS,
        isPWA,
        browserInfo: ua.substring(0, 100),
      };

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          debug.swRegistered = registrations.length > 0;
          
          const registration = await navigator.serviceWorker.ready;
          debug.swActive = !!registration.active;
          
          const subscription = await registration.pushManager.getSubscription();
          debug.hasSubscription = !!subscription;
          debug.subscriptionEndpoint = subscription?.endpoint?.substring(0, 60) || null;
          
          setIsSubscribed(!!subscription);
          setCurrentSubscription(subscription);
          
          console.log('🔔 [NotificationSettings] Debug info:', debug);
        } catch (error) {
          console.error('🔔 [NotificationSettings] Error checking subscription:', error);
        }
      } else {
        console.log('🔔 [NotificationSettings] Push not supported:', { sw: 'serviceWorker' in navigator, pm: 'PushManager' in window });
      }
      
      setDebugInfo(debug);
      setIsLoading(false);
    };

    checkSupport();
  }, []);

  useEffect(() => {
    if (subscriptionsData?.subscriptions?.[0]) {
      const sub = subscriptionsData.subscriptions[0];
      setPreferences({
        marketResolutions: sub.marketResolutions ?? true,
        priceAlerts: sub.priceAlerts ?? true,
        bountyUpdates: sub.bountyUpdates ?? true,
        tradeConfirmations: sub.tradeConfirmations ?? true,
        aiAgentActivity: sub.aiAgentActivity ?? false,
        weeklyDigest: sub.weeklyDigest ?? true,
        morningBriefing: sub.morningBriefing ?? true,
        eveningRecap: sub.eveningRecap ?? true,
        marketMovers: sub.marketMovers ?? true,
        macroAlerts: sub.macroAlerts ?? true,
        breakingNews: sub.breakingNews ?? true,
        coindeskNews: sub.coindeskNews ?? true,
        tradingMetrics: sub.tradingMetrics ?? true,
        whaleAlerts: sub.whaleAlerts ?? true,
        liquidationAlerts: sub.liquidationAlerts ?? true,
        fundingRateAlerts: sub.fundingRateAlerts ?? true,
      });
    }
  }, [subscriptionsData]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      console.log('🔔 [Subscribe] Starting subscription flow...');
      
      // Step 1: Fetch VAPID key
      console.log('🔔 [Subscribe] Step 1: Fetching VAPID key...');
      const vapidResponse = await fetch('/api/push/vapid-key');
      const { vapidPublicKey } = await vapidResponse.json();
      
      if (!vapidPublicKey) {
        console.error('🔔 [Subscribe] No VAPID key returned from server');
        throw new Error('Push notifications not configured on server');
      }
      console.log('🔔 [Subscribe] VAPID key received:', vapidPublicKey.substring(0, 20) + '...');

      // Step 2: Get SW registration
      console.log('🔔 [Subscribe] Step 2: Getting SW registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('🔔 [Subscribe] SW ready, scope:', registration.scope);
      
      // Step 3: Subscribe to push
      console.log('🔔 [Subscribe] Step 3: Creating push subscription...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log('🔔 [Subscribe] Subscription created:', subscription.endpoint.substring(0, 50) + '...');

      const subscriptionJSON = subscription.toJSON();
      
      // Step 4: Save to backend
      console.log('🔔 [Subscribe] Step 4: Saving subscription to backend...');
      await apiRequest('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: subscriptionJSON.endpoint,
            keys: subscriptionJSON.keys,
          },
          deviceInfo: navigator.userAgent,
        }),
      });
      console.log('🔔 [Subscribe] Subscription saved to backend successfully!');

      return subscription;
    },
    onSuccess: (subscription) => {
      console.log('🔔 [Subscribe] SUCCESS - Notifications enabled');
      setIsSubscribed(true);
      setCurrentSubscription(subscription);
      queryClient.invalidateQueries({ queryKey: ['/api/push/subscriptions'] });
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications for important updates.',
      });
    },
    onError: (error: any) => {
      console.error('🔔 [Subscribe] ERROR:', error);
      
      let errorMessage = 'Please check your browser settings and try again.';
      
      if (error.message?.includes('denied') || error.name === 'NotAllowedError') {
        errorMessage = 'Notification permission was denied. Please allow notifications in your browser settings.';
      } else if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        errorMessage = 'Please sign in to enable push notifications.';
      } else if (error.message?.includes('not configured')) {
        errorMessage = 'Push notifications are not available at this time. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Unable to enable notifications',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      console.log('🔔 [Unsubscribe] Starting unsubscribe flow...');
      if (currentSubscription) {
        await apiRequest('/api/push/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ endpoint: currentSubscription.endpoint }),
        });
        await currentSubscription.unsubscribe();
        console.log('🔔 [Unsubscribe] Successfully unsubscribed');
      }
    },
    onSuccess: () => {
      setIsSubscribed(false);
      setCurrentSubscription(null);
      queryClient.invalidateQueries({ queryKey: ['/api/push/subscriptions'] });
      toast({
        title: 'Notifications disabled',
        description: 'You will no longer receive push notifications.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to disable notifications',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      await apiRequest('/api/push/preferences', {
        method: 'PATCH',
        body: JSON.stringify(newPreferences),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/push/subscriptions'] });
    },
  });

  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      console.log('🔔 [Test] Sending test notification...');
      setTestResult({ status: 'pending', message: 'Sending test notification...' });
      const response = await apiRequest('/api/push/test-detailed', { method: 'POST' });
      console.log('🔔 [Test] Response:', response);
      return response;
    },
    onSuccess: (data: any) => {
      console.log('🔔 [Test] Result:', data);
      setTestResult({
        status: data.success ? 'success' : 'failed',
        message: data.finalStatus || (data.success ? 'Sent!' : 'Failed'),
        testId: data.testId,
        steps: data.steps,
        sendResults: data.sendResults,
        hint: data.hint,
      });
      if (data.success) {
        toast({
          title: 'Test notification sent!',
          description: data.finalStatus || 'Check your device for the notification.',
        });
      } else {
        toast({
          title: 'Unable to send test',
          description: 'Please ensure notifications are enabled and try again.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      console.error('🔔 [Test] Error:', error);
      setTestResult({
        status: 'error',
        message: error.message || 'Network error',
        error: String(error),
      });
      toast({
        title: 'Unable to send test',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    updatePreferencesMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="text-sm text-muted-foreground">Checking notification support...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className="glass-card border-amber-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BellOff className="w-5 h-5 text-amber-500" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription>
            {debugInfo?.isIOS && !debugInfo?.isPWA 
              ? 'On iOS, you must first install this app to your Home Screen. Open Safari, tap Share, then "Add to Home Screen".'
              : 'Your browser doesn\'t support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.'}
          </CardDescription>
        </CardHeader>
        {debugInfo && (
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground space-y-1 font-mono bg-black/20 p-3 rounded-lg">
              <div>SW Support: {debugInfo.swSupported ? '✅' : '❌'}</div>
              <div>PushManager: {debugInfo.pushManagerSupported ? '✅' : '❌'}</div>
              <div>iOS: {debugInfo.isIOS ? 'Yes' : 'No'}</div>
              <div>PWA: {debugInfo.isPWA ? 'Yes' : 'No'}</div>
              <div className="truncate">Browser: {debugInfo.browserInfo}</div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="glass-card border-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Push Notifications
          </CardTitle>
          <CardDescription className="mt-1">
            Get real-time alerts for market updates, bounties, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-1">Sign in to enable notifications</p>
              <p className="text-xs text-muted-foreground">
                Create an account or sign in to receive push notifications about your markets, bounties, and earnings.
              </p>
            </div>
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-cyan-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Push Notifications
            </CardTitle>
            <CardDescription className="mt-1">
              Get real-time alerts for market updates, bounties, and more
            </CardDescription>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={(checked) => {
              if (checked) {
                subscribeMutation.mutate();
              } else {
                unsubscribeMutation.mutate();
              }
            }}
            disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
            data-testid="switch-notifications-master"
          />
        </div>
      </CardHeader>

      <AnimatePresence>
        {isSubscribed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-500">
                <Smartphone className="w-4 h-4" />
                <span>This device is receiving notifications</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Platform Alerts</h4>
                
                <div className="space-y-2">
                  {[
                    { key: 'marketResolutions' as const, label: 'Market Resolutions', desc: 'When prediction markets you participated in are resolved' },
                    { key: 'bountyUpdates' as const, label: 'Bounty Updates', desc: 'Assignments, completions, and reward notifications' },
                    { key: 'tradeConfirmations' as const, label: 'Trade Confirmations', desc: 'Confirmation of your market trades' },
                    { key: 'aiAgentActivity' as const, label: 'AI Agent Activity', desc: 'Updates from autonomous AI agents' },
                    { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Sunday summary of your activity and earnings' },
                  ].map(({ key, label, desc }) => (
                    <div 
                      key={key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                      <Switch
                        checked={preferences[key]}
                        onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                        disabled={updatePreferencesMutation.isPending}
                        data-testid={`switch-notification-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-cyan-500/10">
                <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                  📡 Market Intelligence
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">Real-time</span>
                </h4>
                
                <div className="space-y-2">
                  {[
                    { key: 'morningBriefing' as const, label: '🌅 Morning Briefing', desc: 'Daily 8am EST market overview, top movers, and key events' },
                    { key: 'eveningRecap' as const, label: '🌆 Evening Recap', desc: 'Daily 6pm EST market summary and performance highlights' },
                    { key: 'marketMovers' as const, label: '📊 Market Movers', desc: 'Top gainers/losers every 4 hours throughout the day' },
                    { key: 'priceAlerts' as const, label: '🚀 Price Alerts', desc: 'Significant moves: BTC, ETH, and major alts moving 3%+ in an hour' },
                    { key: 'macroAlerts' as const, label: '🏛️ Macro Alerts', desc: 'Fed news, FOMC decisions, and high-impact economic events' },
                    { key: 'breakingNews' as const, label: '⚡ Breaking News', desc: 'Major market-moving news and announcements' },
                  ].map(({ key, label, desc }) => (
                    <div 
                      key={key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors border border-cyan-500/10"
                    >
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                      <Switch
                        checked={preferences[key]}
                        onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                        disabled={updatePreferencesMutation.isPending}
                        data-testid={`switch-notification-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-purple-500/10">
                <h4 className="text-sm font-medium text-purple-400 flex items-center gap-2">
                  📰 CoinDesk News
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Every 15 min</span>
                </h4>
                
                <div className="space-y-2">
                  {[
                    { key: 'coindeskNews' as const, label: '📰 CoinDesk Breaking Stories', desc: 'Major crypto news: ETF approvals, regulations, hacks, market-moving events' },
                  ].map(({ key, label, desc }) => (
                    <div 
                      key={key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-purple-500/5 hover:bg-purple-500/10 transition-colors border border-purple-500/10"
                    >
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                      <Switch
                        checked={preferences[key]}
                        onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                        disabled={updatePreferencesMutation.isPending}
                        data-testid={`switch-notification-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-amber-500/10">
                <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                  📈 Trading Metrics & Derivatives
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Pro Signals</span>
                </h4>
                
                <div className="space-y-2">
                  {[
                    { key: 'tradingMetrics' as const, label: '📈 Trading Metrics Summary', desc: 'Open interest, volume spikes, and positioning data every 10 min' },
                    { key: 'fundingRateAlerts' as const, label: '💰 Funding Rate Alerts', desc: 'Extreme funding rates (>0.05%) signaling potential reversals' },
                    { key: 'liquidationAlerts' as const, label: '💥 Liquidation Cascades', desc: 'Major liquidation events (>$50M) and dominant side getting rekt' },
                    { key: 'whaleAlerts' as const, label: '🐋 Whale Alerts', desc: 'Large wallet movements (>$10M) and smart money accumulation/distribution' },
                  ].map(({ key, label, desc }) => (
                    <div 
                      key={key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-colors border border-amber-500/10"
                    >
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                      <Switch
                        checked={preferences[key]}
                        onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                        disabled={updatePreferencesMutation.isPending}
                        data-testid={`switch-notification-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotificationMutation.mutate()}
                  disabled={testNotificationMutation.isPending}
                  data-testid="button-test-notification"
                >
                  {testNotificationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Test (Push)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔔 [Direct Test] Testing browser notification directly...');
                    if (!('Notification' in window)) {
                      toast({ title: 'Not supported', description: 'Browser does not support notifications', variant: 'destructive' });
                      return;
                    }
                    if (Notification.permission !== 'granted') {
                      toast({ title: 'Permission denied', description: `Notification permission is: ${Notification.permission}`, variant: 'destructive' });
                      return;
                    }
                    try {
                      const notification = new Notification('🧪 Direct Browser Test', {
                        body: `Test at ${new Date().toLocaleTimeString()} - If you see this, browser notifications work!`,
                        icon: '/icon-192.png',
                        tag: 'direct-test-' + Date.now(),
                        requireInteraction: false,
                      });
                      notification.onclick = () => {
                        console.log('🔔 [Direct Test] Notification clicked!');
                        notification.close();
                      };
                      toast({ title: 'Direct notification sent!', description: 'Check if you see it on screen' });
                      console.log('🔔 [Direct Test] Notification created successfully:', notification);
                    } catch (err: any) {
                      console.error('🔔 [Direct Test] Failed:', err);
                      toast({ title: 'Unable to send notification', description: 'Please check your browser permissions and try again.', variant: 'destructive' });
                    }
                  }}
                  data-testid="button-test-direct-notification"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Test Browser (Direct)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-muted-foreground"
                  data-testid="button-toggle-debug"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Debug
                  {showDebug ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className={`mt-3 p-3 rounded-lg text-xs font-mono ${
                  testResult.status === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                  testResult.status === 'pending' ? 'bg-blue-500/10 border border-blue-500/20' :
                  'bg-red-500/10 border border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {testResult.status === 'pending' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                    {(testResult.status === 'failed' || testResult.status === 'error') && <XCircle className="w-4 h-4 text-red-400" />}
                    <span className={`font-medium ${
                      testResult.status === 'success' ? 'text-green-400' :
                      testResult.status === 'pending' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {testResult.message}
                    </span>
                  </div>
                  {testResult.testId && (
                    <div className="text-muted-foreground mb-1">Test ID: {testResult.testId}</div>
                  )}
                  {testResult.hint && (
                    <div className="text-amber-400 mb-2">{testResult.hint}</div>
                  )}
                  {testResult.steps && testResult.steps.length > 0 && (
                    <div className="space-y-1 mt-2 border-t border-white/10 pt-2">
                      <div className="text-muted-foreground mb-1">Steps:</div>
                      {testResult.steps.map((step: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          {step.status === 'success' && <span className="text-green-400">✓</span>}
                          {step.status === 'failed' && <span className="text-red-400">✗</span>}
                          {step.status === 'skipped' && <span className="text-gray-400">○</span>}
                          <span className="text-muted-foreground">{step.step}:</span>
                          <span className={step.status === 'failed' ? 'text-red-400' : ''}>{step.details}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {testResult.sendResults && testResult.sendResults.length > 0 && (
                    <div className="space-y-1 mt-2 border-t border-white/10 pt-2">
                      <div className="text-muted-foreground mb-1">Send Results:</div>
                      {testResult.sendResults.map((result: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          {result.success ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}
                          <span className="truncate">{result.endpoint}</span>
                          {result.error && <span className="text-red-400 ml-2">{result.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {testResult.error && (
                    <div className="text-red-400 mt-2">Error: {testResult.error}</div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTestResult(null)}
                    className="mt-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Panel - Always available when authenticated */}
      {!isSubscribed && isAuthenticated && (
        <CardContent className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="text-muted-foreground w-full justify-start"
            data-testid="button-toggle-debug-unsubscribed"
          >
            <Bug className="w-4 h-4 mr-2" />
            Troubleshoot Notifications
            {showDebug ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </CardContent>
      )}

      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-2 space-y-4 border-t border-cyan-500/10">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Push Notification Diagnostics
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runDiagnostics}
                    disabled={isRunningDiagnostics}
                  >
                    {isRunningDiagnostics ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Run Diagnostics
                  </Button>
                </div>
              </div>

              {/* Quick Status */}
              {debugInfo && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded ${debugInfo.swSupported && debugInfo.swRegistered ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    Service Worker: {debugInfo.swRegistered ? 'Registered' : 'Not Registered'}
                  </div>
                  <div className={`p-2 rounded ${debugInfo.pushManagerSupported ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    Push API: {debugInfo.pushManagerSupported ? 'Supported' : 'Not Supported'}
                  </div>
                  <div className={`p-2 rounded ${debugInfo.notificationPermission === 'granted' ? 'bg-green-500/10 text-green-400' : debugInfo.notificationPermission === 'denied' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    Permission: {debugInfo.notificationPermission}
                  </div>
                  <div className={`p-2 rounded ${debugInfo.hasSubscription ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    Subscription: {debugInfo.hasSubscription ? 'Active' : 'None'}
                  </div>
                  {debugInfo.isIOS && (
                    <div className={`p-2 rounded col-span-2 ${debugInfo.isPWA ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      iOS PWA: {debugInfo.isPWA ? 'Installed (Good!)' : 'NOT Installed - Add to Home Screen first!'}
                    </div>
                  )}
                </div>
              )}

              {/* Diagnostic Steps */}
              {diagnosticSteps.length > 0 && (
                <div className="space-y-2 text-xs font-mono bg-black/30 p-3 rounded-lg max-h-60 overflow-y-auto">
                  {diagnosticSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {step.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />}
                      {step.status === 'failed' && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                      {step.status === 'pending' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                      {step.status === 'checking' && <Loader2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-spin" />}
                      <div>
                        <span className={step.status === 'success' ? 'text-green-400' : step.status === 'failed' ? 'text-red-400' : step.status === 'pending' ? 'text-amber-400' : 'text-cyan-400'}>
                          {step.step}:
                        </span>
                        <span className="text-muted-foreground ml-1">{step.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Server Debug Info */}
              {serverDebugData?.diagnostics && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground">Server Status</h5>
                  <div className="text-xs font-mono bg-black/30 p-3 rounded-lg space-y-1">
                    <div>VAPID Configured: {serverDebugData.diagnostics.serverConfig.serviceInitialized ? '✅' : '❌'}</div>
                    <div>Your Subscriptions: {serverDebugData.diagnostics.userSubscriptions.count}</div>
                    <div>Platform Total: {serverDebugData.diagnostics.platformStats.totalActiveSubscriptions}</div>
                    <div className="text-muted-foreground">
                      Chrome: {serverDebugData.diagnostics.platformStats.subscriptionsByType.chrome}, 
                      Firefox: {serverDebugData.diagnostics.platformStats.subscriptionsByType.firefox}, 
                      Safari: {serverDebugData.diagnostics.platformStats.subscriptionsByType.safari}
                    </div>
                    {serverDebugData.diagnostics.troubleshooting.length > 0 && (
                      <div className="text-amber-400 mt-2">
                        Tips: {serverDebugData.diagnostics.troubleshooting.join(' | ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* iOS-specific instructions */}
              {debugInfo?.isIOS && !debugInfo?.isPWA && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs">
                  <h5 className="font-medium text-amber-400 mb-2">iOS Push Notification Requirements:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-amber-200">
                    <li>Open this website in <strong>Safari</strong> (not Chrome or Firefox)</li>
                    <li>Tap the <strong>Share</strong> button (square with arrow)</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Open the app from your Home Screen</li>
                    <li>Return here and enable notifications</li>
                  </ol>
                  <p className="mt-2 text-muted-foreground">Note: Requires iOS 16.4 or later</p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
