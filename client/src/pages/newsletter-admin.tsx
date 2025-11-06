import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Eye, Mail, Calendar, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

const ADMIN_USERNAMES = ['arslan'];

export default function NewsletterAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState('');
  const [, setLocation] = useLocation();

  // Fetch current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/me'],
  });

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!userLoading && user) {
      const isAdmin = ADMIN_USERNAMES.includes(user.username);
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive"
        });
        setLocation('/dashboard');
      }
    }
  }, [user, userLoading, setLocation, toast]);

  // Show loading while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Checking permissions...</span>
        </div>
      </div>
    );
  }

  // Show unauthorized if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="neural-glass border-red-500/20 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-6 h-6" />
              Authentication Required
            </CardTitle>
            <CardDescription>Please log in to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation('/auth')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show unauthorized if not admin
  const isAdmin = ADMIN_USERNAMES.includes(user.username);
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="neural-glass border-red-500/20 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-6 h-6" />
              Access Denied
            </CardTitle>
            <CardDescription>This page is restricted to administrators only</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation('/dashboard')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch newsletter status
  const { data: status } = useQuery({
    queryKey: ['/api/newsletter/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch newsletter history
  const { data: history } = useQuery({
    queryKey: ['/api/newsletter/history'],
  });

  // Send test newsletter mutation
  const sendTestMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('/api/newsletter/test', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test newsletter",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test newsletter",
        variant: "destructive"
      });
    }
  });

  // Send newsletter to all mutation
  const sendAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/newsletter/send', {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Newsletter Sent",
        description: `Sent to ${data.sentCount} subscribers`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/newsletter/history'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send newsletter",
        variant: "destructive"
      });
    }
  });

  const handleSendTest = () => {
    if (testEmail) {
      sendTestMutation.mutate(testEmail);
    }
  };

  const handleSendAll = () => {
    if (window.confirm('Send newsletter to ALL subscribers? This action cannot be undone.')) {
      sendAllMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Newsletter Admin</h1>
            <p className="text-slate-400">Manage automated crypto newsletters</p>
          </div>
        </div>

        {/* Scheduler Status */}
        <Card className="neural-glass border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Scheduler Status
            </CardTitle>
            <CardDescription>Automated sends every Monday & Friday at 8am EST</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  {status?.isRunning ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="font-semibold text-white">
                    {status?.isRunning ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-400">Scheduler Status</p>
              </div>

              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="font-semibold text-white mb-2">
                  {status?.nextMonday || 'Loading...'}
                </div>
                <p className="text-sm text-slate-400">Next Monday Send</p>
              </div>

              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="font-semibold text-white mb-2">
                  {status?.nextFriday || 'Loading...'}
                </div>
                <p className="text-sm text-slate-400">Next Friday Send</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Newsletter */}
          <Card className="neural-glass border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                Test Newsletter
              </CardTitle>
              <CardDescription>Send a test newsletter to your email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="bg-slate-900/50 border-purple-500/20"
                />
              </div>
              <Button
                onClick={handleSendTest}
                disabled={!testEmail || sendTestMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {sendTestMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('/api/newsletter/preview', '_blank')}
                className="w-full border-purple-500/20 hover:bg-purple-500/10"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview in Browser
              </Button>
            </CardContent>
          </Card>

          {/* Send to All */}
          <Card className="neural-glass border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                Send to Waitlist
              </CardTitle>
              <CardDescription>Manually trigger newsletter send to all subscribers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-200">
                  ⚠️ This will send emails to ALL subscribed waitlist members. Use with caution!
                </p>
              </div>
              <Button
                onClick={handleSendAll}
                disabled={sendAllMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {sendAllMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending to All...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to All Subscribers
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Newsletter History */}
        <Card className="neural-glass border-purple-500/20">
          <CardHeader>
            <CardTitle>Send History</CardTitle>
            <CardDescription>Recent newsletter sends</CardDescription>
          </CardHeader>
          <CardContent>
            {history?.newsletters?.length > 0 ? (
              <div className="space-y-2">
                {history.newsletters.map((newsletter: any) => (
                  <div
                    key={newsletter.id}
                    className="p-3 rounded-lg bg-slate-900/50 border border-purple-500/10 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-white">{newsletter.subject}</div>
                      <div className="text-sm text-slate-400">
                        Sent to {newsletter.recipientCount} recipients
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(newsletter.sentAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No newsletters sent yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
