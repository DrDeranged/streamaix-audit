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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", iconColor)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800/60 border-slate-700">
          <CardHeader className="text-center">
            <Bell className="w-12 h-12 text-fuchsia-400 mx-auto mb-4" />
            <CardTitle className="text-white">Sign in Required</CardTitle>
            <CardDescription>Please sign in to manage your notification preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const hasSubscription = subscriptionsData?.subscriptions && subscriptionsData.subscriptions.length > 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-fuchsia-400" />
              Notification Settings
            </h1>
            <p className="text-sm text-slate-400 mt-1">Customize which alerts and updates you receive</p>
          </div>
        </div>
        
        {!hasSubscription ? (
          <Card className="bg-slate-800/60 border-slate-700 mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-500">
                  <BellOff className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Enable Push Notifications</CardTitle>
                  <CardDescription>Get real-time alerts for market movements and stream updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={enableNotifications}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-600 hover:to-purple-600"
                data-testid="enable-notifications-btn"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-emerald-500/10 border-emerald-500/30 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-400">Notifications Active</p>
                    <p className="text-xs text-slate-400">{currentPrefs?.deviceInfo || 'This device'}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testNotificationMutation.mutate()}
                  disabled={testNotificationMutation.isPending}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
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
          </Card>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
          </div>
        ) : hasSubscription ? (
          <div className="space-y-6">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-fuchsia-400" />
                  Stream Notifications
                </CardTitle>
                <CardDescription>Alerts for live streams and streaming activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceToggle
                  label="Stream Live Alerts"
                  description="When creators you follow go live"
                  icon={Radio}
                  iconColor="bg-red-500/20"
                  enabled={localPrefs.streamLive ?? true}
                  onToggle={(v) => handleToggle('streamLive', v)}
                />
                <PreferenceToggle
                  label="Tips Received"
                  description="When you receive tips as a host"
                  icon={DollarSign}
                  iconColor="bg-amber-500/20"
                  enabled={localPrefs.streamTips ?? true}
                  onToggle={(v) => handleToggle('streamTips', v)}
                />
                <PreferenceToggle
                  label="Viewer Milestones"
                  description="When you hit 100, 500, or 1K viewers"
                  icon={Award}
                  iconColor="bg-purple-500/20"
                  enabled={localPrefs.streamMilestones ?? true}
                  onToggle={(v) => handleToggle('streamMilestones', v)}
                />
                <PreferenceToggle
                  label="Scheduled Stream Reminders"
                  description="Reminders before streams you're interested in"
                  icon={Calendar}
                  iconColor="bg-cyan-500/20"
                  enabled={localPrefs.streamReminders ?? true}
                  onToggle={(v) => handleToggle('streamReminders', v)}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Market Alerts
                </CardTitle>
                <CardDescription>Price movements and market intelligence updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceToggle
                  label="Price Alerts"
                  description="Custom price targets you've set"
                  icon={TrendingUp}
                  iconColor="bg-cyan-500/20"
                  enabled={localPrefs.priceAlerts ?? true}
                  onToggle={(v) => handleToggle('priceAlerts', v)}
                />
                <PreferenceToggle
                  label="Market Movers"
                  description="Significant price movements (+/-5%)"
                  icon={BarChart3}
                  iconColor="bg-emerald-500/20"
                  enabled={localPrefs.marketMovers ?? true}
                  onToggle={(v) => handleToggle('marketMovers', v)}
                />
                <PreferenceToggle
                  label="Macro Alerts"
                  description="Fed decisions, CPI, major economic events"
                  icon={AlertTriangle}
                  iconColor="bg-amber-500/20"
                  enabled={localPrefs.macroAlerts ?? true}
                  onToggle={(v) => handleToggle('macroAlerts', v)}
                />
                <PreferenceToggle
                  label="Whale Alerts"
                  description="Large wallet movements"
                  icon={Waves}
                  iconColor="bg-blue-500/20"
                  enabled={localPrefs.whaleAlerts ?? true}
                  onToggle={(v) => handleToggle('whaleAlerts', v)}
                />
                <PreferenceToggle
                  label="Liquidation Alerts"
                  description="Large liquidation events"
                  icon={AlertTriangle}
                  iconColor="bg-red-500/20"
                  enabled={localPrefs.liquidationAlerts ?? true}
                  onToggle={(v) => handleToggle('liquidationAlerts', v)}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-orange-400" />
                  News & Updates
                </CardTitle>
                <CardDescription>Daily briefings and breaking news</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceToggle
                  label="Breaking News"
                  description="Major news affecting markets"
                  icon={Newspaper}
                  iconColor="bg-orange-500/20"
                  enabled={localPrefs.breakingNews ?? true}
                  onToggle={(v) => handleToggle('breakingNews', v)}
                />
                <PreferenceToggle
                  label="Morning Briefing"
                  description="Daily market summary at 8 AM"
                  icon={Calendar}
                  iconColor="bg-blue-500/20"
                  enabled={localPrefs.morningBriefing ?? true}
                  onToggle={(v) => handleToggle('morningBriefing', v)}
                />
                <PreferenceToggle
                  label="Evening Recap"
                  description="End of day market summary"
                  icon={Calendar}
                  iconColor="bg-purple-500/20"
                  enabled={localPrefs.eveningRecap ?? true}
                  onToggle={(v) => handleToggle('eveningRecap', v)}
                />
                <PreferenceToggle
                  label="Weekly Digest"
                  description="Weekly summary of platform activity"
                  icon={Newspaper}
                  iconColor="bg-fuchsia-500/20"
                  enabled={localPrefs.weeklyDigest ?? true}
                  onToggle={(v) => handleToggle('weeklyDigest', v)}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  Platform Activity
                </CardTitle>
                <CardDescription>Bounties, trades, and AI agent activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreferenceToggle
                  label="Bounty Updates"
                  description="Updates on bounties you're involved in"
                  icon={Award}
                  iconColor="bg-amber-500/20"
                  enabled={localPrefs.bountyUpdates ?? true}
                  onToggle={(v) => handleToggle('bountyUpdates', v)}
                />
                <PreferenceToggle
                  label="Trade Confirmations"
                  description="When your prediction market trades execute"
                  icon={TrendingUp}
                  iconColor="bg-emerald-500/20"
                  enabled={localPrefs.tradeConfirmations ?? true}
                  onToggle={(v) => handleToggle('tradeConfirmations', v)}
                />
                <PreferenceToggle
                  label="Market Resolutions"
                  description="When prediction markets you traded resolve"
                  icon={CheckCircle2}
                  iconColor="bg-cyan-500/20"
                  enabled={localPrefs.marketResolutions ?? true}
                  onToggle={(v) => handleToggle('marketResolutions', v)}
                />
                <PreferenceToggle
                  label="AI Agent Activity"
                  description="Notable actions by AI agents"
                  icon={Bot}
                  iconColor="bg-purple-500/20"
                  enabled={localPrefs.aiAgentActivity ?? false}
                  onToggle={(v) => handleToggle('aiAgentActivity', v)}
                />
              </CardContent>
            </Card>
            
            {hasChanges && (
              <div className="sticky bottom-4 flex justify-end">
                <Button 
                  onClick={handleSave}
                  disabled={updatePreferencesMutation.isPending}
                  className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-600 hover:to-purple-600 shadow-lg shadow-fuchsia-500/30"
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
