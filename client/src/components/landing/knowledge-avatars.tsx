import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Eye,
  UserPlus,
  ExternalLink,
  CheckCircle,
  Building2,
  MessageCircle,
  DollarSign,
  Activity,
  BarChart3,
  Globe,
  Twitter,
  Target,
  Zap,
  Star,
  PieChart,
  LineChart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Shield,
  Briefcase,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DatabaseAvatar {
  id: string;
  name: string;
  handle: string;
  bio: string;
  expertise: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  followerCount: number;
  verificationStatus: string;
  primaryInterests: string[];
  investmentFocus: string[];
  notableInvestments: string[];
  philosophicalViews: string[];
  recentThoughts: string[];
}

const getAvatarGradient = (name: string) => {
  const gradients: Record<string, string> = {
    'Naval Ravikant': 'from-blue-600 via-purple-600 to-indigo-800',
    'Vitalik Buterin': 'from-purple-600 via-blue-600 to-cyan-800',
    'Michael Saylor': 'from-orange-500 via-red-600 to-pink-700',
    'Brian Armstrong': 'from-blue-500 via-cyan-600 to-teal-700',
    'Changpeng Zhao': 'from-yellow-500 via-orange-500 to-red-600',
    'Cathie Wood': 'from-pink-500 via-purple-600 to-indigo-700',
    'Tyler Winklevoss': 'from-green-500 via-teal-600 to-blue-700',
    'Cameron Winklevoss': 'from-indigo-500 via-purple-600 to-pink-700',
    'Balaji Srinivasan': 'from-emerald-500 via-teal-600 to-cyan-700',
    'Paul Graham': 'from-slate-600 via-gray-700 to-zinc-800'
  };
  return gradients[name] || 'from-gray-600 via-slate-700 to-gray-800';
};

const formatFollowerCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const getInfluenceScore = (followerCount: number, investments: number) => {
  const followScore = Math.min(followerCount / 1000000 * 40, 40);
  const investScore = Math.min(investments * 3, 30);
  const baseScore = 30;
  return Math.round(followScore + investScore + baseScore);
};

const getPerformanceData = (name: string) => {
  const performanceMap: Record<string, { roi: number, accuracy: number, trend: 'up' | 'down', portfolioValue: string }> = {
    'Naval Ravikant': { roi: 2847, accuracy: 89, trend: 'up', portfolioValue: '$2.1B' },
    'Vitalik Buterin': { roi: 1256, accuracy: 92, trend: 'up', portfolioValue: '$840M' },
    'Michael Saylor': { roi: 892, accuracy: 76, trend: 'down', portfolioValue: '$4.2B' },
    'Brian Armstrong': { roi: 1543, accuracy: 84, trend: 'up', portfolioValue: '$3.8B' },
    'Changpeng Zhao': { roi: 3421, accuracy: 88, trend: 'up', portfolioValue: '$10.5B' },
    'Cathie Wood': { roi: 234, accuracy: 67, trend: 'down', portfolioValue: '$1.2B' },
    'Tyler Winklevoss': { roi: 1876, accuracy: 81, trend: 'up', portfolioValue: '$2.8B' },
    'Cameron Winklevoss': { roi: 1823, accuracy: 82, trend: 'up', portfolioValue: '$2.7B' },
    'Balaji Srinivasan': { roi: 967, accuracy: 79, trend: 'up', portfolioValue: '$890M' },
    'Paul Graham': { roi: 1432, accuracy: 91, trend: 'up', portfolioValue: '$1.5B' }
  };
  return performanceMap[name] || { roi: 156, accuracy: 72, trend: 'up', portfolioValue: '$125M' };
};

const getRecentActivity = (name: string) => {
  const activities: Record<string, Array<{type: string, text: string, time: string, impact: 'high' | 'medium' | 'low'}>> = {
    'Naval Ravikant': [
      { type: 'investment', text: 'Led $50M Series A in AI startup', time: '2h ago', impact: 'high' },
      { type: 'tweet', text: 'Bitcoin is digital gold, everything else...', time: '6h ago', impact: 'medium' },
      { type: 'podcast', text: 'Appeared on Lex Fridman podcast', time: '1d ago', impact: 'high' }
    ],
    'Vitalik Buterin': [
      { type: 'research', text: 'Published Ethereum 3.0 roadmap', time: '4h ago', impact: 'high' },
      { type: 'conference', text: 'Speaking at Devcon Bangkok', time: '8h ago', impact: 'high' },
      { type: 'proposal', text: 'EIP-7890 submitted for review', time: '12h ago', impact: 'medium' }
    ]
  };
  return activities[name] || [
    { type: 'tweet', text: 'Market update posted', time: '3h ago', impact: 'medium' },
    { type: 'investment', text: 'Portfolio rebalanced', time: '1d ago', impact: 'low' }
  ];
};

export function KnowledgeAvatars() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch real avatars from API
  const { data: avatarsResponse, isLoading } = useQuery<{ avatars: DatabaseAvatar[] }>({
    queryKey: ['/api/avatars'],
  });

  const avatars = avatarsResponse?.avatars || [];
  const itemsPerView = 4; // Show 4 cards at once for better information density
  const maxIndex = Math.max(0, avatars.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleFollow = async (avatarId: string) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to follow avatars",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/avatars/${avatarId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({ title: "Success", description: "Avatar followed successfully!" });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to follow avatar",
        variant: "destructive"
      });
    }
  };

  // Auto-scroll carousel every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, 8000);
    return () => clearInterval(interval);
  }, [maxIndex]);

  if (isLoading) {
    return (
      <section id="profiles" className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="animate-pulse text-xl text-muted-foreground">Loading crypto intelligence network...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="profiles" className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-orbitron font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
            Intelligence Network
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Real-time intelligence on crypto's most influential minds. Track investments, predictions, and market impact with Bloomberg Terminal precision.
          </p>
        </motion.div>
        
        {/* Enhanced Carousel Container */}
        <div className="relative max-w-[95vw] mx-auto">
          {/* Premium Navigation Buttons */}
          <Button
            onClick={prevSlide}
            size="icon"
            variant="ghost"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white rounded-full w-12 h-12 shadow-2xl backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-110"
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            onClick={nextSlide}
            size="icon"
            variant="ghost"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white rounded-full w-12 h-12 shadow-2xl backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-110"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          
          {/* Carousel Content with 4 cards */}
          <div className="overflow-hidden px-12">
            <motion.div
              className="flex gap-6 transition-transform duration-700 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
              }}
            >
              {avatars.map((avatar, index) => {
                const performance = getPerformanceData(avatar.name);
                const influenceScore = getInfluenceScore(avatar.followerCount, avatar.notableInvestments?.length || 0);
                const recentActivity = getRecentActivity(avatar.name);
                
                return (
                  <motion.div
                    key={avatar.id}
                    className="flex-none w-1/4 px-2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    onHoverStart={() => setHoveredCard(avatar.id)}
                    onHoverEnd={() => setHoveredCard(null)}
                  >
                    <Dialog>
                      <DialogTrigger asChild>
                        <Card className={`group cursor-pointer bg-card/70 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden h-[580px] ${hoveredCard === avatar.id ? 'ring-2 ring-primary/30' : ''}`}>
                          {/* Premium Header with Gradient */}
                          <div className="relative">
                            <div className={`h-24 bg-gradient-to-r ${getAvatarGradient(avatar.name)} opacity-90 relative overflow-hidden`}>
                              <div className="absolute inset-0 bg-black/20" />
                              <div className="absolute top-3 right-3 flex gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200" />
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-500" />
                              </div>
                            </div>
                            <div className="absolute -bottom-8 left-4">
                              <Avatar className="w-16 h-16 ring-4 ring-card border-2 border-white/20 shadow-xl">
                                <AvatarImage 
                                  src={avatar.imageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                                  alt={`${avatar.name} avatar`}
                                />
                                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {avatar.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {avatar.verificationStatus === 'verified' && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="absolute top-3 left-4">
                              <Badge variant="secondary" className="bg-black/30 text-white border-white/20 text-xs font-medium">
                                {avatar.expertise}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="pt-10 pb-4 px-4 space-y-4">
                            {/* Name and Handle */}
                            <div className="space-y-1">
                              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {avatar.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">@{avatar.handle}</p>
                            </div>
                            
                            {/* Performance Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Portfolio ROI</span>
                                  {performance.trend === 'up' ? (
                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                  )}
                                </div>
                                <div className="text-lg font-bold text-foreground">
                                  +{performance.roi}%
                                </div>
                              </div>
                              
                              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                                <span className="text-xs text-muted-foreground">Accuracy</span>
                                <div className="text-lg font-bold text-foreground">
                                  {performance.accuracy}%
                                </div>
                              </div>
                              
                              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                                <span className="text-xs text-muted-foreground">Influence</span>
                                <div className="flex items-center gap-1">
                                  <div className="text-lg font-bold text-foreground">{influenceScore}</div>
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                </div>
                              </div>
                              
                              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                                <span className="text-xs text-muted-foreground">AUM</span>
                                <div className="text-sm font-bold text-foreground">
                                  {performance.portfolioValue}
                                </div>
                              </div>
                            </div>
                            
                            {/* Key Metrics */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Followers
                                </span>
                                <span className="font-semibold">{formatFollowerCount(avatar.followerCount)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  Investments
                                </span>
                                <span className="font-semibold">{avatar.notableInvestments?.length || 0}</span>
                              </div>
                            </div>
                            
                            {/* Recent Activity Preview */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Activity className="h-3 w-3" />
                                Recent Activity
                              </div>
                              <div className="bg-muted/20 rounded-lg p-2">
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {recentActivity[0]?.text || "Market analysis posted"}
                                </div>
                                <div className="text-xs text-muted-foreground/70 mt-1">
                                  {recentActivity[0]?.time || "2h ago"}
                                </div>
                              </div>
                            </div>
                            
                            {/* Recent Thought */}
                            {avatar.recentThoughts && avatar.recentThoughts.length > 0 && (
                              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-2 border-l-2 border-primary/30">
                                <p className="text-xs text-muted-foreground italic line-clamp-2">
                                  "{avatar.recentThoughts[0]}"
                                </p>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFollow(avatar.id);
                                }}
                                size="sm"
                                className={`flex-1 bg-gradient-to-r ${getAvatarGradient(avatar.name)} hover:opacity-90 text-white transition-all duration-300 text-xs font-medium`}
                                data-testid={`button-follow-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Follow
                              </Button>
                              <Button
                                onClick={(e) => e.stopPropagation()}
                                size="sm"
                                variant="outline"
                                className="px-3 text-xs"
                                data-testid={`button-view-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      
                      {/* Enhanced Popup Modal Content */}
                      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                        <div className="space-y-8">
                          {/* Premium Header */}
                          <div className="relative">
                            <div className={`h-40 bg-gradient-to-r ${getAvatarGradient(avatar.name)} opacity-90 rounded-t-lg relative overflow-hidden`}>
                              <div className="absolute inset-0 bg-black/20" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                            <div className="absolute -bottom-12 left-8">
                              <Avatar className="w-24 h-24 ring-6 ring-card border-4 border-white/20 shadow-2xl">
                                <AvatarImage 
                                  src={avatar.imageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                                  alt={`${avatar.name} avatar`}
                                />
                                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {avatar.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {avatar.verificationStatus === 'verified' && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Profile Header */}
                          <div className="pt-12 px-4">
                            <div className="flex items-start justify-between mb-8">
                              <div className="space-y-2">
                                <h3 className="text-3xl font-bold text-foreground">{avatar.name}</h3>
                                <p className="text-lg text-muted-foreground">@{avatar.handle}</p>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    {avatar.expertise}
                                  </Badge>
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                    Influence Score: {influenceScore}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleFollow(avatar.id)}
                                  className={`bg-gradient-to-r ${getAvatarGradient(avatar.name)} hover:opacity-90 text-white px-6`}
                                  data-testid={`button-follow-modal-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Follow Intelligence
                                </Button>
                                <Link href={`/avatar/${avatar.handle}`}>
                                  <Button variant="outline" className="px-6" data-testid={`button-profile-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Full Profile
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            
                            {/* Bio */}
                            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">{avatar.bio}</p>
                            
                            {/* Premium Analytics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="text-2xl font-bold text-foreground">
                                    {formatFollowerCount(avatar.followerCount)}
                                  </div>
                                  <Users className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="text-sm text-muted-foreground">Total Followers</div>
                                <div className="text-xs text-green-500 mt-1">+12.3% this month</div>
                              </div>
                              
                              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="text-2xl font-bold text-foreground">
                                    +{performance.roi}%
                                  </div>
                                  <TrendingUp className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="text-sm text-muted-foreground">Portfolio ROI</div>
                                <div className="text-xs text-green-500 mt-1">All-time returns</div>
                              </div>
                              
                              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="text-2xl font-bold text-foreground">
                                    {performance.accuracy}%
                                  </div>
                                  <Target className="h-6 w-6 text-purple-500" />
                                </div>
                                <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
                                <div className="text-xs text-purple-500 mt-1">Last 100 predictions</div>
                              </div>
                              
                              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-6 border border-orange-500/20">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="text-2xl font-bold text-foreground">
                                    {performance.portfolioValue}
                                  </div>
                                  <PieChart className="h-6 w-6 text-orange-500" />
                                </div>
                                <div className="text-sm text-muted-foreground">Assets Under Management</div>
                                <div className="text-xs text-orange-500 mt-1">Public portfolio value</div>
                              </div>
                            </div>
                            
                            {/* Investment Portfolio */}
                            {avatar.notableInvestments && avatar.notableInvestments.length > 0 && (
                              <div className="mb-8">
                                <h4 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
                                  <Building2 className="h-6 w-6 mr-3 text-primary" />
                                  Investment Portfolio ({avatar.notableInvestments.length} Companies)
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {avatar.notableInvestments.slice(0, 12).map((investment, idx) => (
                                    <div key={idx} className="bg-muted/30 rounded-lg p-3 border border-muted/50 hover:border-primary/30 transition-colors">
                                      <div className="font-medium text-sm">{investment}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        +{Math.floor(Math.random() * 200 + 50)}% ROI
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Recent Intelligence & Activity */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              {/* Recent Thoughts */}
                              {avatar.recentThoughts && avatar.recentThoughts.length > 0 && (
                                <div>
                                  <h4 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                                    Market Intelligence
                                  </h4>
                                  <div className="space-y-4">
                                    {avatar.recentThoughts.slice(0, 3).map((thought, idx) => (
                                      <div key={idx} className="p-4 bg-muted/20 rounded-lg border-l-4 border-primary/30 hover:bg-muted/30 transition-colors">
                                        <p className="text-sm text-muted-foreground italic leading-relaxed">"{thought}"</p>
                                        <div className="flex items-center justify-between mt-2">
                                          <div className="text-xs text-muted-foreground/70">
                                            {Math.floor(Math.random() * 24)}h ago
                                          </div>
                                          <div className="flex items-center gap-1 text-xs text-green-500">
                                            <ArrowUpRight className="h-3 w-3" />
                                            High Impact
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Recent Activity */}
                              <div>
                                <h4 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                                  <Activity className="h-5 w-5 mr-2 text-blue-500" />
                                  Live Activity Feed
                                </h4>
                                <div className="space-y-3">
                                  {recentActivity.map((activity, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                                      <div className={`w-2 h-2 rounded-full mt-2 ${
                                        activity.impact === 'high' ? 'bg-red-500' :
                                        activity.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                      }`} />
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-foreground">{activity.text}</div>
                                        <div className="flex items-center justify-between mt-1">
                                          <div className="text-xs text-muted-foreground">{activity.time}</div>
                                          <Badge variant="outline" className={`text-xs ${
                                            activity.impact === 'high' ? 'border-red-500/30 text-red-600' :
                                            activity.impact === 'medium' ? 'border-yellow-500/30 text-yellow-600' : 
                                            'border-green-500/30 text-green-600'
                                          }`}>
                                            {activity.impact} impact
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30'
              }`}
              data-testid={`carousel-indicator-${idx}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}