import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAuth, useLogin, useRegister, useWalletLogin, useTwitterLogin } from '@/hooks/useAuth';
import { WalletConnector } from '@/components/wallet/WalletConnector';
import { Loader2, Wallet, Mail, User, Lock, Shield, ArrowLeft } from 'lucide-react';
import { FaTwitter } from 'react-icons/fa';
import { motion } from 'framer-motion';

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
  }, [isAuthenticated, setLocation]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back to Home Button */}
        <Button
          variant="outline"
          className="mb-6 bg-white/10 border-white/20 hover:bg-white/20 text-white"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            StreamAiX
          </h1>
          <p className="text-slate-400 mt-2">Join the future of content curation</p>
        </div>

        <Card className="backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Get Started</CardTitle>
            <CardDescription className="text-slate-300">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="login" className="data-[state=active]:bg-white/20">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white/20">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-gray-900 dark:text-white">
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
                      className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-900 dark:text-white">
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
                      className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600"
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
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-[#1da1f2]/10 border-[#1da1f2]/20 hover:bg-[#1da1f2]/20 text-white"
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
                      <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">
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
                      <Label htmlFor="register-username" className="text-gray-900 dark:text-white">
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
                        className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-gray-900 dark:text-white">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-900 dark:text-white">
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
                        className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password" className="text-gray-900 dark:text-white">
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
                        className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-bio" className="text-gray-900 dark:text-white">
                      Bio (Optional)
                    </Label>
                    <Textarea
                      id="register-bio"
                      placeholder="Tell us about yourself..."
                      value={registerData.bio}
                      onChange={(e) => setRegisterData({ ...registerData, bio: e.target.value })}
                      className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400 resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-wallet" className="text-gray-900 dark:text-white">
                        <Wallet className="w-4 h-4 inline mr-2" />
                        Wallet (Optional)
                      </Label>
                      <Input
                        id="register-wallet"
                        type="text"
                        placeholder="0x..."
                        value={registerData.walletAddress}
                        onChange={(e) => setRegisterData({ ...registerData, walletAddress: e.target.value })}
                        className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-ens" className="text-gray-900 dark:text-white">
                        ENS Name (Optional)
                      </Label>
                      <Input
                        id="register-ens"
                        type="text"
                        placeholder="yourname.eth"
                        value={registerData.ensName}
                        onChange={(e) => setRegisterData({ ...registerData, ensName: e.target.value })}
                        className="bg-white/10 border-white/20 text-gray-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600"
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
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-[#1da1f2]/10 border-[#1da1f2]/20 hover:bg-[#1da1f2]/20 text-white"
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
                      <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">
                        Connect your Web3 wallet to access premium features and earn rewards
                      </p>
                    </div>
                  </WalletConnector>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}