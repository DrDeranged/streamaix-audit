import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useWeb3 } from "@/hooks/useWeb3";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { WalletSelectionModal } from "@/components/wallet/WalletSelectionModal";
import { ConnectWalletButton } from "@/components/trade/ConnectWalletButton";
import { 
  Moon, 
  Sun, 
  Sparkles, 
  Menu, 
  X, 
  User, 
  LogOut, 
  BarChart3, 
  Wallet, 
  Loader2, 
  ExternalLink, 
  Settings,
  Target,
  Compass,
  LayoutDashboard,
  CreditCard,
  UserCircle,
  Zap,
  Activity,
  TrendingUp,
  Brain,
  Trophy,
  ChevronDown,
  LineChart,
  PieChart,
  FileText,
  MessageCircle,
  Bot,
  Users,
  Briefcase,
  Award,
  Play,
  Video,
  Bell,
  Radio,
  Calendar,
  Mic,
  History,
  GraduationCap
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { usePointsBalance, formatPoints, useDailyLogin } from "@/hooks/usePoints";
import { Coins } from "lucide-react";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  
  const { 
    wallet, 
    isConnected, 
    isConnecting, 
    disconnect, 
    formatAddress
  } = useWeb3();

  const { data: pointsData } = usePointsBalance();
  const dailyLoginMutation = useDailyLogin();

  useEffect(() => {
    if (isAuthenticated) {
      dailyLoginMutation.mutate();
    }
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 text-body">
      {/* Glass background layer */}
      <div 
        className="absolute inset-0 bg-ink-page/90 border-b border-ink-edge"
        style={{
           background: 'rgba(16,22,42,0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      />
      {/* Light mode background */}
      <div className="absolute inset-0 bg-ink-page/40" />
      {/* Gradient bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-ink-edge" />
      {/* Top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-accent-core/20" />
      {/* Subtle inner glow */}
      <div className="absolute inset-0 bg-accent-core/5 pointer-events-none" />
      
      <div className="relative container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo with Animated Glow - Navigate to landing page or scroll to top */}
          <motion.div 
            className="flex items-center space-x-3 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (location === '/') {
                window.dispatchEvent(new CustomEvent('go-to-hero'));
              } else {
                setLocation('/');
              }
            }}
          >
              <div className="relative">
                <div className="absolute inset-0 bg-accent-core/30 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
                <div className="relative w-10 h-10 rounded-full bg-accent-core flex items-center justify-center shadow-lg glow-accent">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="font-display font-bold text-xl sm:text-2xl text-primary transition-all duration-300">
                StreamAiX
              </div>
          </motion.div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Desktop Navigation with Icons */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {/* Discover Dropdown (formerly Analytics) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-3.5 py-2 rounded-xl text-secondary hover:text-primary hover:bg-ink-raised transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {/* Glass hover background */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl bg-ink-raised" />
                    {/* Bottom highlight on hover */}
                    <div className="absolute bottom-0 left-2 right-2 h-px bg-accent-core opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-accent-bright group-hover:text-accent-bright transition-colors drop-shadow-sm" />
                      <span className="font-medium text-sm">Discover</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-ink-surface border border-ink-edge rounded-xl shadow-2xl" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/discover" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Compass className="w-4 h-4 text-accent-bright" />
                      <div>
                        <span className="font-medium block">Market Intelligence</span>
                        <span className="text-xs text-secondary">Real-time analytics</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/insights" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Brain className="w-4 h-4 text-accent-bright" />
                      <div>
                        <span className="font-medium block">AI Insights</span>
                        <span className="text-xs text-secondary">Smart signals</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/analytics" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <PieChart className="w-4 h-4 text-gain" />
                      <div>
                        <span className="font-medium block">Platform Stats</span>
                        <span className="text-xs text-secondary">Engagement metrics</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ai-trading" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <LineChart className="w-4 h-4 text-warn" />
                      <div>
                        <span className="font-medium block">AI Trading Signals</span>
                        <span className="text-xs text-secondary">Crypto & mining stocks</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bot-trading" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Bot className="w-4 h-4 text-accent-bright" />
                      <div>
                        <span className="font-medium block">Bot Trading Simulator</span>
                        <span className="text-xs text-secondary">Stake on AI bots</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Streams Dropdown - NEW Priority Feature */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-3.5 py-2 rounded-xl text-secondary hover:text-primary hover:bg-ink-raised transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl bg-ink-raised" />
                    <div className="absolute bottom-0 left-2 right-2 h-px bg-accent-core opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-1.5">
                      <div className="relative">
                        <Radio className="w-4 h-4 text-live group-hover:text-live transition-colors drop-shadow-sm" />
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                      </div>
                      <span className="font-medium text-sm">Streams</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-ink-surface border border-ink-edge rounded-xl shadow-2xl" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/streams/discover" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Radio className="w-4 h-4 text-live" />
                      <div>
                        <span className="font-medium block">Browse All</span>
                        <span className="text-xs text-secondary">AI & creators live</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/go-live" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Mic className="w-4 h-4 text-warn" />
                      <div>
                        <span className="font-medium block">Go Live</span>
                        <span className="text-xs text-secondary">Start streaming</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/replays" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <History className="w-4 h-4 text-warn" />
                      <div>
                        <span className="font-medium block">Replays</span>
                        <span className="text-xs text-secondary">Past streams</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Markets Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-3.5 py-2 rounded-xl text-secondary hover:text-primary hover:bg-ink-raised transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl bg-ink-raised" />
                    <div className="absolute bottom-0 left-2 right-2 h-px bg-ink-divider opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-accent-bright group-hover:text-accent-bright transition-colors drop-shadow-sm" />
                      <span className="font-medium text-sm">Markets</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-ink-surface border border-ink-edge rounded-xl shadow-2xl" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/markets" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <TrendingUp className="w-4 h-4 text-accent-bright" />
                      <div>
                        <span className="font-medium block">Prediction Markets</span>
                        <span className="text-xs text-muted">Trade outcomes</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/portfolio" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Briefcase className="w-4 h-4 text-aurora-magenta" />
                      <div>
                        <span className="font-medium block">Asset Portfolio</span>
                        <span className="text-xs text-muted">Track all your assets</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/markets/leaderboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Trophy className="w-4 h-4 text-warn" />
                      <div>
                        <span className="font-medium block">Leaderboard</span>
                        <span className="text-xs text-muted">Top traders</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/markets/achievements" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Award className="w-4 h-4 text-accent-bright" />
                      <div>
                        <span className="font-medium block">Achievements</span>
                        <span className="text-xs text-muted">Badges & rewards</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Bounties Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-3.5 py-2 rounded-xl text-secondary hover:text-primary hover:bg-ink-raised transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl bg-ink-raised" />
                    <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-ink-divider opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-aurora-magenta group-hover:text-aurora-magenta transition-colors drop-shadow-sm" />
                      <span className="font-medium text-sm">Bounties</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-ink-surface border border-ink-edge rounded-xl shadow-2xl" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/bounties" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Target className="w-4 h-4 text-aurora-magenta" />
                      <div>
                        <span className="font-medium block">Browse Bounties</span>
                        <span className="text-xs text-muted">Find opportunities</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/leaderboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Trophy className="w-4 h-4 text-warn" />
                      <div>
                        <span className="font-medium block">Hunter Leaderboard</span>
                        <span className="text-xs text-muted">Top contributors</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/summaries" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <FileText className="w-4 h-4 text-accent-bright" />
                      <div>
                        <span className="font-medium block">Summaries</span>
                        <span className="text-xs text-muted">AI-generated content</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Content Dropdown (NEW) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-3.5 py-2 rounded-xl text-secondary hover:text-primary hover:bg-ink-raised transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl bg-ink-raised" />
                    <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-ink-divider opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-gain group-hover:text-gain transition-colors drop-shadow-sm" />
                      <span className="font-medium text-sm">AI</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-ink-surface border border-ink-edge rounded-xl shadow-2xl" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/create-summary" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Play className="w-4 h-4 text-gain" />
                      <div>
                        <span className="font-medium block">AI Analysis</span>
                        <span className="text-xs text-muted">Process videos</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/chat" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <MessageCircle className="w-4 h-4 text-accent-bright" />
                      <div>
                        <span className="font-medium block">AI Chat</span>
                        <span className="text-xs text-muted">Ask anything</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/summaries" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Bot className="w-4 h-4 text-warn" />
                      <div>
                        <span className="font-medium block">Knowledge Avatars</span>
                        <span className="text-xs text-muted">AI personas</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Community Dropdown (NEW) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-3.5 py-2 rounded-xl text-secondary hover:text-primary hover:bg-ink-raised transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl bg-ink-raised" />
                    <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-ink-divider opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-500 group-hover:text-indigo-400 transition-colors drop-shadow-sm" />
                      <span className="font-medium text-sm">Community</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-ink-surface border border-ink-edge rounded-xl shadow-2xl" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="font-medium block">Dashboard</span>
                        <span className="text-xs text-muted">Your activity</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/points" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Coins className="w-4 h-4 text-gain" />
                      <div>
                        <span className="font-medium block">STREAM Points</span>
                        <span className="text-xs text-muted">Earn & track rewards</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/leagues" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                      <Trophy className="w-4 h-4 text-warn" />
                      <div>
                        <span className="font-medium block">Leagues</span>
                        <span className="text-xs text-muted">Compete & earn</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Learn - Standalone prominent item */}
              <Link href="/learn">
                <motion.button 
                  className="group relative px-3.5 py-2 rounded-xl text-secondary hover:text-primary hover:bg-ink-raised transition-all duration-300 overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  data-testid="nav-learn"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%)', backdropFilter: 'blur(8px)' }} />
                  <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-ink-divider opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-violet-500 group-hover:text-violet-400 transition-colors drop-shadow-sm" />
                    <span className="font-medium text-sm">Learn</span>
                  </div>
                </motion.button>
              </Link>
              
              {/* STREAM Points Balance */}
              {isAuthenticated && pointsData && (
                <Link href="/points">
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink-raised border border-ink-edge cursor-pointer hover:border-accent-core transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid="points-balance-nav"
                  >
                    <div className="p-1 rounded-xl bg-accent-core">
                      <Coins className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gain">
                      {formatPoints(pointsData.balance)}
                    </span>
                  </motion.div>
                </Link>
              )}
              
              {/* Authentication - Glassmorphism Avatar */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0 hover:bg-transparent transition-all duration-200 group">
                      {/* Animated gradient border ring */}
                      <div className="absolute -inset-[2px] rounded-full bg-accent-core opacity-70 group-hover:opacity-100 blur-[2px] transition-opacity duration-300" />
                      {/* Glass container */}
                      <div className="relative h-10 w-10 rounded-full bg-ink-raised backdrop-blur-xl p-[2px]">
                        <Avatar className="h-full w-full">
                          <AvatarImage src={user?.avatar} alt={user?.username} />
                          <AvatarFallback className="bg-accent-core text-white font-semibold text-sm">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {/* Online indicator */}
                      <motion.div 
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-gain border-2 border-white rounded-full shadow-lg shadow-gain/50"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-ink-surface border border-ink-edge rounded-xl shadow-2xl" align="end" forceMount>
                    <div className="flex items-center gap-3 p-3 border-b border-ink-edge">
                      <Avatar className="h-10 w-10 ring-2 ring-accent-core/30">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-accent-core text-white text-sm">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-primary text-sm font-semibold">{user?.username}</p>
                        <p className="text-muted text-xs">Premium Member</p>
                      </div>
                    </div>

                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                          <LayoutDashboard className="w-4 h-4 text-accent-bright" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/discover" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                          <Compass className="w-4 h-4 text-accent-bright" />
                          <span className="font-medium">Discover</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/points" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                          <Coins className="w-4 h-4 text-gain" />
                          <div className="flex items-center gap-2">
                            <span className="font-medium">STREAM Points</span>
                            {pointsData && (
                              <span className="text-xs text-gain font-semibold">{formatPoints(pointsData.balance)}</span>
                            )}
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wallet-dashboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                          <Wallet className="w-4 h-4 text-aurora-magenta" />
                          <span className="font-medium">Wallet</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1">
                        <UserCircle className="w-4 h-4 text-accent-bright" />
                        <span className="font-medium">Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-body hover:text-primary hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1"
                        onClick={() => setNotificationsOpen(true)}
                      >
                        <Bell className="w-4 h-4 text-warn" />
                        <span className="font-medium">Notifications</span>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-accent-core/15" />

                    <div className="py-1">
                      <DropdownMenuItem 
                        className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-loss hover:text-loss hover:bg-ink-raised transition-all duration-200 rounded-xl mx-1"
                        onClick={() => logoutMutation.mutate()}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Sign out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" className="text-body hover:text-primary hover:bg-ink-raised">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Mobile STREAM Points Display - Only on mobile, next to theme toggle */}
            {isAuthenticated && pointsData && (
              <Link href="/points" className="md:hidden">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gain/20 border border-gain/30 hover:bg-gain/30 transition-all duration-200"
                  data-testid="mobile-landing-points-display"
                >
                  <Coins className="w-4 h-4 text-gain" />
                  <span className="text-sm font-bold text-gain">
                    {formatPoints(pointsData.balance || 0)}
                  </span>
                </motion.div>
              </Link>
            )}

            {/* Theme Toggle - Glassmorphism */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
              <div className="absolute -inset-[1px] rounded-xl bg-accent-core opacity-70 group-hover:opacity-100 blur-[1px] transition-opacity duration-300" />
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="relative bg-ink-surface backdrop-blur-xl border-0 hover:bg-ink-raised transition-all duration-300"
              >
                {theme === "light" ? (
                  <Sun className="w-5 h-5 text-warn" />
                ) : (
                  <Moon className="w-5 h-5 text-accent-bright" />
                )}
              </Button>
            </motion.div>
            
            {/* Web3 Wallet Connection (wagmi + RainbowKit, Base) */}
            <div className="hidden md:block">
              <ConnectWalletButton />
            </div>

            {/* Mobile Menu Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden bg-ink-surface border-ink-edge hover:bg-ink-raised rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden mt-4 py-4 border-t border-ink-divider bg-ink-surface backdrop-blur-xl rounded-xl mx-2 shadow-xl"
            >
              <div className="flex flex-col space-y-1 px-4 max-h-[70vh] overflow-y-auto">
                {/* Streams Section - Unified */}
                <div className="text-xs font-semibold text-live uppercase tracking-wider px-3 py-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                  Streams
                </div>
                <Link href="/streams/discover" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Radio className="w-4 h-4 text-live" />
                    Browse All
                  </button>
                </Link>
                <Link href="/go-live" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Mic className="w-4 h-4 text-warn" />
                    Go Live
                  </button>
                </Link>
                <Link href="/replays" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <History className="w-4 h-4 text-warn" />
                    Replays
                  </button>
                </Link>

                {/* Discover Section */}
                <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3 py-2 mt-2">Discover</div>
                <Link href="/discover" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Compass className="w-4 h-4 text-accent-bright" />
                    Market Intelligence
                  </button>
                </Link>
                <Link href="/insights" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Brain className="w-4 h-4 text-accent-bright" />
                    AI Insights
                  </button>
                </Link>
                <Link href="/ai-trading" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <LineChart className="w-4 h-4 text-warn" />
                    AI Trading Signals
                  </button>
                </Link>
                <Link href="/bot-trading" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Bot className="w-4 h-4 text-accent-bright" />
                    Bot Trading Simulator
                  </button>
                </Link>

                {/* Markets Section */}
                <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3 py-2 mt-2">Markets</div>
                <Link href="/markets" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <TrendingUp className="w-4 h-4 text-accent-bright" />
                    Prediction Markets
                  </button>
                </Link>
                <Link href="/portfolio" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Briefcase className="w-4 h-4 text-aurora-magenta" />
                    Asset Portfolio
                  </button>
                </Link>

                {/* Bounties Section */}
                <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3 py-2 mt-2">Bounties</div>
                <Link href="/bounties" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Target className="w-4 h-4 text-aurora-magenta" />
                    Browse Bounties
                  </button>
                </Link>
                <Link href="/leaderboard" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Trophy className="w-4 h-4 text-warn" />
                    Leaderboard
                  </button>
                </Link>

                {/* AI Section */}
                <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3 py-2 mt-2">AI</div>
                <Link href="/create-summary" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Play className="w-4 h-4 text-gain" />
                    AI Analysis
                  </button>
                </Link>
                <Link href="/chat" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <MessageCircle className="w-4 h-4 text-accent-bright" />
                    AI Chat
                  </button>
                </Link>

                {/* Community Section */}
                <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3 py-2 mt-2">Community</div>
                <Link href="/dashboard" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                    Dashboard
                  </button>
                </Link>
                <Link href="/points" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <Coins className="w-4 h-4 text-gain" />
                    STREAM Points
                  </button>
                </Link>
                <Link href="/learn" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                  >
                    <GraduationCap className="w-4 h-4 text-accent-bright" />
                    Learning Hub
                  </button>
                </Link>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setNotificationsOpen(true);
                  }}
                  className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                >
                  <Bell className="w-4 h-4 text-warn" />
                  Notifications
                </button>
                
                {/* Mobile Authentication */}
                {!isAuthenticated && (
                  <div className="pt-3 border-t border-ink-divider mt-3">
                    <Link href="/auth" className="block">
                      <button className="w-full text-center bg-accent-core/15 hover:bg-accent-core/25 text-primary border border-accent-core/30 py-2.5 px-4 rounded-xl transition-all duration-200 font-medium text-sm">
                        Sign In
                      </button>
                    </Link>
                  </div>
                )}
                
                {/* Mobile User Menu */}
                {isAuthenticated && (
                  <div className="space-y-1 pt-3 border-t border-ink-divider mt-3">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-accent-core/10 rounded-xl border border-accent-core/20">
                      <Avatar className="h-7 w-7 ring-2 ring-accent-core/30">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-accent-core text-primary text-xs font-medium">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium text-sm">{user?.username}</span>
                    </div>
                    <Link href="/wallet-dashboard" className="block">
                      <button className="w-full flex items-center gap-3 text-left text-body hover:text-primary py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm">
                        <Wallet className="w-4 h-4 text-aurora-magenta" />
                        Wallet
                      </button>
                    </Link>
                    <button 
                      className="w-full flex items-center gap-3 text-left text-loss hover:text-loss py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 font-medium text-sm"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}

                {/* Mobile Wallet Connection */}
                {isConnected && wallet ? (
                  <div className="space-y-3 pt-3 border-t border-ink-divider mt-3">
                    <div className="p-3 bg-ink-raised rounded-xl border border-ink-edge">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-body">Wallet Connected</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-gain rounded-full animate-pulse" />
                          <span className="text-xs text-gain">Active</span>
                        </div>
                      </div>
                      <p className="text-xs text-secondary font-mono bg-ink-page px-2 py-1 rounded-xl border border-ink-edge">{formatAddress(wallet.address)}</p>
                    </div>
                    <Button 
                      onClick={disconnect}
                      variant="outline" 
                      className="w-full border-loss/30 text-loss hover:bg-ink-raised hover:border-loss/50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-ink-divider mt-3">
                    <Button 
                      onClick={() => setWalletModalOpen(true)}
                      disabled={isConnecting}
                      className="w-full grad-accent hover:bg-accent-deep shadow-lg glow-accent"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Wallet Selection Modal */}
      <WalletSelectionModal 
        open={walletModalOpen} 
        onOpenChange={setWalletModalOpen}
        onWalletConnected={() => setMobileMenuOpen(false)}
      />

      {/* Notifications Dialog */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="bg-ink-surface border-ink-edge text-primary rounded-2xl max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5 text-warn" />
              Notification Settings
            </DialogTitle>
          </DialogHeader>
          <NotificationSettings />
        </DialogContent>
      </Dialog>
    </nav>
  );
}
