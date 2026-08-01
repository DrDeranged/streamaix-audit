import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Bell, 
  BellOff, 
  TrendingUp, 
  Radio, 
  DollarSign, 
  Award, 
  Bot, 
  Newspaper, 
  BarChart3,
  Waves,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  Save,
  Loader2,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface NotificationPreferences {
  id: string;
  deviceInfo?: string;
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
  coinDeskNews: boolean;
  fundingRateAlerts: boolean;
  liquidationAlerts: boolean;
  whaleAlerts: boolean;
  streamLive: boolean;
  streamTips: boolean;
  streamMilestones: boolean;
  streamReminders: boolean;
}

interface PreferenceToggleProps {
  label: string;
  description: string;
  icon: any;
  iconColor: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  isPending?: boolean;
}

function PreferenceToggle({ label, description, icon: Icon, iconColor, enabled, onToggle, isPending }: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink-divider bg-ink-raised px-4 py-3 transition-colors hover:border-ink-edge">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-xl p-2", iconColor)}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">{label}</p>
          <p className="text-xs text-secondary">{description}</p>
        </div>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
        disabled={isPending}
        data-testid={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
    </div>
  );
}

export default function NotificationSettings() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences>>({});
  
  const { data: subscriptionsData, isLoading } = useQuery<{ success: boolean; subscriptions: NotificationPreferences[] }>({
    queryKey: ['/api/push/subscriptions'],
    enabled: isAuthenticated,
  });
  
  const currentPrefs = subscriptionsData?.subscriptions?.[0];
  
  useEffect(() => {
    if (currentPrefs && Object.keys(localPrefs).length === 0) {
      setLocalPrefs(currentPrefs);
    }
  }, [currentPrefs]);
  
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      return apiRequest('/api/push/preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferences),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/push/subscriptions'] });
      setHasChanges(false);
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving preferences",
        description: error.message || "Failed to update notification preferences",
        variant: "destructive",
      });
    },
  });
  
  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/push/test', {
        method: 'POST',
      });
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "Test notification sent",
          description: "Check your browser for the notification.",
        });
      } else {
        toast({
          title: "Notifications not enabled",
          description: data.error || "Please enable browser notifications first.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to send test",
        description: "Please enable browser notifications first.",
        variant: "destructive",
      });
    },
  });
  
  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };
  
  const handleSave = () => {
    updatePreferencesMutation.mutate(localPrefs);
  };
  
  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll now receive push notifications.",
        });
        window.location.reload();
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink-page p-4">
        <Surface className="w-full max-w-md">
          <CardHeader className="text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-accent-bright" />
            <SectionTitle as="h2">Sign in Required</SectionTitle>
            <CardDescription className="text-secondary">Please sign in to manage your notification preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth" className="block">
              <Button className="grad-accent glow-accent w-full rounded-xl text-primary">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Surface>
      </div>
    );
  }
  
  const hasSubscription = subscriptionsData?.subscriptions && subscriptionsData.subscriptions.length > 0;
  
  return (
    <div className="min-h-[100dvh] bg-ink-page">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl text-secondary hover:bg-ink-raised hover:text-primary">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <SectionTitle as="h1" className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-accent-bright" />
              Notification Settings
            </SectionTitle>
            <p className="mt-1 text-sm text-secondary">Customize which alerts and updates you receive</p>
          </div>
        </div>
        
        {!hasSubscription ? (
          <Surface className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent-core p-3">
                  <BellOff className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <SectionTitle as="h2">Enable Push Notifications</SectionTitle>
                  <CardDescription className="text-secondary">Get real-time alerts for market movements and stream updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={enableNotifications}
                className="grad-accent glow-accent rounded-xl text-primary"
                data-testid="enable-notifications-btn"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            </CardContent>
          </Surface>
        ) : (
          <Surface className="mb-6 border-gain/30 bg-gain/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-gain" />
                  <div>
                    <p className="text-sm font-medium text-gain">Notifications Active</p>
                    <p className="text-xs text-secondary">{currentPrefs?.deviceInfo || 'This device'}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testNotificationMutation.mutate()}
                  disabled={testNotificationMutation.isPending}
                   className="rounded-xl border border-gain/30 text-gain hover:bg-gain/10"
                  data-testid="test-notification-btn"
                >
                  {testNotificationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Test
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Surface>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-bright" />
          </div>
        ) : hasSubscription ? (
          <div className="space-y-6">
            <Surface>
              <CardHeader>
                <SectionTitle as="h2" className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-accent-bright" />
                  Stream Notifications
                </SectionTitle>
                <CardDescription className="text-secondary">Alerts for live streams and streaming activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceToggle
                  label="Stream Live Alerts"
                  description="When creators you follow go live"
                  icon={Radio}
                  iconColor="bg-loss/10"
                  enabled={localPrefs.streamLive ?? true}
                  onToggle={(v) => handleToggle('streamLive', v)}
                />
                <PreferenceToggle
                  label="Tips Received"
                  description="When you receive tips as a host"
                  icon={DollarSign}
                  iconColor="bg-warn/10"
                  enabled={localPrefs.streamTips ?? true}
                  onToggle={(v) => handleToggle('streamTips', v)}
                />
                <PreferenceToggle
                  label="Viewer Milestones"
                  description="When you hit 100, 500, or 1K viewers"
                  icon={Award}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.streamMilestones ?? true}
                  onToggle={(v) => handleToggle('streamMilestones', v)}
                />
                <PreferenceToggle
                  label="Scheduled Stream Reminders"
                  description="Reminders before streams you're interested in"
                  icon={Calendar}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.streamReminders ?? true}
                  onToggle={(v) => handleToggle('streamReminders', v)}
                />
              </CardContent>
            </Surface>
            
            <Surface>
              <CardHeader>
                <SectionTitle as="h2" className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent-bright" />
                  Market Alerts
                </SectionTitle>
                <CardDescription className="text-secondary">Price movements and market intelligence updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceToggle
                  label="Price Alerts"
                  description="Custom price targets you've set"
                  icon={TrendingUp}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.priceAlerts ?? true}
                  onToggle={(v) => handleToggle('priceAlerts', v)}
                />
                <PreferenceToggle
                  label="Market Movers"
                  description="Significant price movements (+/-5%)"
                  icon={BarChart3}
                  iconColor="bg-gain/10"
                  enabled={localPrefs.marketMovers ?? true}
                  onToggle={(v) => handleToggle('marketMovers', v)}
                />
                <PreferenceToggle
                  label="Macro Alerts"
                  description="Fed decisions, CPI, major economic events"
                  icon={AlertTriangle}
                  iconColor="bg-warn/10"
                  enabled={localPrefs.macroAlerts ?? true}
                  onToggle={(v) => handleToggle('macroAlerts', v)}
                />
                <PreferenceToggle
                  label="Whale Alerts"
                  description="Large wallet movements"
                  icon={Waves}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.whaleAlerts ?? true}
                  onToggle={(v) => handleToggle('whaleAlerts', v)}
                />
                <PreferenceToggle
                  label="Liquidation Alerts"
                  description="Large liquidation events"
                  icon={AlertTriangle}
                  iconColor="bg-loss/10"
                  enabled={localPrefs.liquidationAlerts ?? true}
                  onToggle={(v) => handleToggle('liquidationAlerts', v)}
                />
              </CardContent>
            </Surface>
            
            <Surface>
              <CardHeader>
                <SectionTitle as="h2" className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-warn" />
                  News & Updates
                </SectionTitle>
                <CardDescription className="text-secondary">Daily briefings and breaking news</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceToggle
                  label="Breaking News"
                  description="Major news affecting markets"
                  icon={Newspaper}
                  iconColor="bg-warn/10"
                  enabled={localPrefs.breakingNews ?? true}
                  onToggle={(v) => handleToggle('breakingNews', v)}
                />
                <PreferenceToggle
                  label="Morning Briefing"
                  description="Daily market summary at 8 AM"
                  icon={Calendar}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.morningBriefing ?? true}
                  onToggle={(v) => handleToggle('morningBriefing', v)}
                />
                <PreferenceToggle
                  label="Evening Recap"
                  description="End of day market summary"
                  icon={Calendar}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.eveningRecap ?? true}
                  onToggle={(v) => handleToggle('eveningRecap', v)}
                />
                <PreferenceToggle
                  label="Weekly Digest"
                  description="Weekly summary of platform activity"
                  icon={Newspaper}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.weeklyDigest ?? true}
                  onToggle={(v) => handleToggle('weeklyDigest', v)}
                />
              </CardContent>
            </Surface>
            
            <Surface>
              <CardHeader>
                <SectionTitle as="h2" className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-accent-bright" />
                  Platform Activity
                </SectionTitle>
                <CardDescription className="text-secondary">Bounties, trades, and AI agent activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceToggle
                  label="Bounty Updates"
                  description="Updates on bounties you're involved in"
                  icon={Award}
                  iconColor="bg-warn/10"
                  enabled={localPrefs.bountyUpdates ?? true}
                  onToggle={(v) => handleToggle('bountyUpdates', v)}
                />
                <PreferenceToggle
                  label="Trade Confirmations"
                  description="When your prediction market trades execute"
                  icon={TrendingUp}
                  iconColor="bg-gain/10"
                  enabled={localPrefs.tradeConfirmations ?? true}
                  onToggle={(v) => handleToggle('tradeConfirmations', v)}
                />
                <PreferenceToggle
                  label="Market Resolutions"
                  description="When prediction markets you traded resolve"
                  icon={CheckCircle2}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.marketResolutions ?? true}
                  onToggle={(v) => handleToggle('marketResolutions', v)}
                />
                <PreferenceToggle
                  label="AI Agent Activity"
                  description="Notable actions by AI agents"
                  icon={Bot}
                  iconColor="bg-accent-core/10"
                  enabled={localPrefs.aiAgentActivity ?? false}
                  onToggle={(v) => handleToggle('aiAgentActivity', v)}
                />
              </CardContent>
            </Surface>
            
            {hasChanges && (
              <div className="sticky bottom-4 flex justify-end">
                <Button 
                  onClick={handleSave}
                  disabled={updatePreferencesMutation.isPending}
                  className="grad-accent glow-accent rounded-xl text-primary"
                  data-testid="save-preferences-btn"
                >
                  {updatePreferencesMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
