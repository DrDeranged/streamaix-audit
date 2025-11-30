import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, BellOff, Smartphone, Check, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export function NotificationSettings() {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    marketResolutions: true,
    priceAlerts: true,
    bountyUpdates: true,
    tradeConfirmations: true,
    aiAgentActivity: false,
    weeklyDigest: true,
  });

  const { data: subscriptionsData } = useQuery<{ success: boolean; subscriptions: any[] }>({
    queryKey: ['/api/push/subscriptions'],
    enabled: isSubscribed,
  });

  useEffect(() => {
    const checkSupport = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
          setCurrentSubscription(subscription);
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
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
      });
    }
  }, [subscriptionsData]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const vapidResponse = await fetch('/api/push/vapid-key');
      const { vapidPublicKey } = await vapidResponse.json();
      
      if (!vapidPublicKey) {
        throw new Error('Push notifications not configured');
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subscriptionJSON = subscription.toJSON();
      
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

      return subscription;
    },
    onSuccess: (subscription) => {
      setIsSubscribed(true);
      setCurrentSubscription(subscription);
      queryClient.invalidateQueries({ queryKey: ['/api/push/subscriptions'] });
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications for important updates.',
      });
    },
    onError: (error: any) => {
      console.error('Subscribe error:', error);
      toast({
        title: 'Failed to enable notifications',
        description: error.message || 'Please check your browser settings and try again.',
        variant: 'destructive',
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (currentSubscription) {
        await apiRequest('/api/push/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ endpoint: currentSubscription.endpoint }),
        });
        await currentSubscription.unsubscribe();
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
        title: 'Failed to disable notifications',
        description: error.message,
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
      await apiRequest('/api/push/test', { method: 'POST' });
    },
    onSuccess: () => {
      toast({
        title: 'Test sent',
        description: 'Check your notifications!',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to send test',
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
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
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
            Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
          </CardDescription>
        </CardHeader>
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
                <h4 className="text-sm font-medium text-muted-foreground">Notification Types</h4>
                
                <div className="space-y-2">
                  {[
                    { key: 'marketResolutions' as const, label: 'Market Resolutions', desc: 'When prediction markets you participated in are resolved' },
                    { key: 'priceAlerts' as const, label: 'Price Alerts', desc: 'When assets hit your target prices' },
                    { key: 'bountyUpdates' as const, label: 'Bounty Updates', desc: 'Assignments, completions, and reward notifications' },
                    { key: 'tradeConfirmations' as const, label: 'Trade Confirmations', desc: 'Confirmation of your market trades' },
                    { key: 'aiAgentActivity' as const, label: 'AI Agent Activity', desc: 'Updates from autonomous AI agents' },
                    { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of platform activity and your earnings' },
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

              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotificationMutation.mutate()}
                  disabled={testNotificationMutation.isPending}
                  data-testid="button-test-notification"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Test
                </Button>
              </div>
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
