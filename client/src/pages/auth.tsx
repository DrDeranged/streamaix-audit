import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, useLogin, useRegister, useWalletLogin, useTwitterLogin } from '@/hooks/useAuth';
import { WalletConnector } from '@/components/wallet/WalletConnector';
import { Loader2, Wallet, Mail, User, Lock, Shield, ArrowLeft } from 'lucide-react';
import { FaTwitter } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Surface from '@/components/ds/Surface';
import { AmbientBackground } from '@/components/ds/AmbientBackground';
import SectionTitle from '@/components/ds/SectionTitle';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    walletAddress: '',
    ensName: '',
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const walletLoginMutation = useWalletLogin();
  const { initiateTwitterLogin } = useTwitterLogin();

  // Redirect to home page if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up empty fields before sending
    const cleanData = {
      username: registerData.username,
      password: registerData.password,
      confirmPassword: registerData.confirmPassword,
      email: registerData.email || undefined,
      walletAddress: registerData.walletAddress || undefined,
      ensName: registerData.ensName || undefined,
      bio: registerData.bio || undefined,
    };
    
    registerMutation.mutate(cleanData);
  };

  const handleWalletConnect = async (address: string, signature: string, message: string) => {
    walletLoginMutation.mutate({
      walletAddress: address,
      signature,
      message,
    });
  };

  return (
    <div className="min-h-[100dvh] bg-ink-page flex items-center justify-center p-4 relative overflow-hidden">
      <AmbientBackground />
      <div className="relative z-10 w-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back to Home Button */}
        <Button
          variant="outline"
           className="mb-6 rounded-xl border border-ink-edge bg-ink-surface text-body hover:bg-ink-raised hover:text-primary"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
           <h1 className="font-display text-3xl text-primary">
             StreamAiX
           </h1>
           <p className="text-secondary mt-2">Join the future of content curation</p>
        </div>

         <Surface className="p-0 shadow-2xl">
           <div className="p-6 pb-3">
             <SectionTitle as="h2">Get Started</SectionTitle>
             <p className="mt-2 text-sm text-secondary">
              Sign in to your account or create a new one
             </p>
           </div>
           <div className="p-6 pt-3">
            <Tabs defaultValue="login" className="w-full">
               <TabsList className="grid w-full grid-cols-2 rounded-xl border border-ink-edge bg-ink-raised p-1">
                 <TabsTrigger value="login" className="rounded-xl text-secondary data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent">
                  Sign In
                </TabsTrigger>
                 <TabsTrigger value="register" className="rounded-xl text-secondary data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="login-username" className="text-body">
                      <User className="w-4 h-4 inline mr-2" />
                      Username
                    </Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                       className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted"
                    />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="login-password" className="text-body">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                       className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted"
                    />
                  </div>
                  <Button
                    type="submit"
                     className="w-full rounded-xl grad-accent text-primary glow-accent hover:bg-accent-deep"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Sign In
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                     <span className="w-full border-t border-ink-divider" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-ink-surface px-2 text-muted">Or continue with</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                     className="w-full rounded-xl border border-ink-edge bg-ink-raised text-body hover:bg-accent-core/10 hover:text-primary"
                    onClick={initiateTwitterLogin}
                  >
                    <FaTwitter className="w-4 h-4 mr-2" />
                    Continue with X
                  </Button>

                  <WalletConnector
                    onWalletConnected={handleWalletConnect}
                    showBalance={false}
                    showNetwork={false}
                  >
                    <div className="text-center">
                       <Shield className="h-8 w-8 text-accent-bright mx-auto mb-2" />
                       <p className="text-sm text-body">
                        Connect your Web3 wallet to access premium features and earn rewards
                      </p>
                    </div>
                  </WalletConnector>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="register-username" className="text-body">
                        <User className="w-4 h-4 inline mr-2" />
                        Username
                      </Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Choose username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                         className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted"
                      />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="register-email" className="text-body">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                         className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="register-password" className="text-body">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Password
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                         className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted"
                      />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="register-confirm-password" className="text-body">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Confirm
                      </Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Confirm password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                         className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="register-bio" className="text-body">
                      Bio (Optional)
                    </Label>
                    <Textarea
                      id="register-bio"
                      placeholder="Tell us about yourself..."
                      value={registerData.bio}
                      onChange={(e) => setRegisterData({ ...registerData, bio: e.target.value })}
                       className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="register-wallet" className="text-body">
                        <Wallet className="w-4 h-4 inline mr-2" />
                        Wallet (Optional)
                      </Label>
                      <Input
                        id="register-wallet"
                        type="text"
                        placeholder="0x..."
                        value={registerData.walletAddress}
                        onChange={(e) => setRegisterData({ ...registerData, walletAddress: e.target.value })}
                         className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted"
                      />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="register-ens" className="text-body">
                        ENS Name (Optional)
                      </Label>
                      <Input
                        id="register-ens"
                        type="text"
                        placeholder="yourname.eth"
                        value={registerData.ensName}
                        onChange={(e) => setRegisterData({ ...registerData, ensName: e.target.value })}
                         className="rounded-xl border border-ink-edge bg-ink-raised text-primary placeholder:text-muted"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                     className="w-full rounded-xl grad-accent text-primary glow-accent hover:bg-accent-deep"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Create Account
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                     <span className="w-full border-t border-ink-divider" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-ink-surface px-2 text-muted">Or continue with</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                     className="w-full rounded-xl border border-ink-edge bg-ink-raised text-body hover:bg-accent-core/10 hover:text-primary"
                    onClick={initiateTwitterLogin}
                  >
                    <FaTwitter className="w-4 h-4 mr-2" />
                    Continue with X
                  </Button>

                  <WalletConnector
                    onWalletConnected={handleWalletConnect}
                    showBalance={false}
                    showNetwork={false}
                  >
                    <div className="text-center">
                       <Shield className="h-8 w-8 text-accent-bright mx-auto mb-2" />
                       <p className="text-sm text-body">
                        Connect your Web3 wallet to access premium features and earn rewards
                      </p>
                    </div>
                  </WalletConnector>
                </div>
              </TabsContent>
            </Tabs>
           </div>
         </Surface>
      </motion.div>
      </div>
    </div>
  );
}