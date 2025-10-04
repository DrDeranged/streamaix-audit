import { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  User,
  Heart,
  MessageSquare,
  Share2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Brain,
  Lightbulb,
  Target,
  Calendar,
  ExternalLink,
  Twitter,
  Linkedin,
  Globe,
  Star,
  Award,
  Zap,
  PieChart,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Quote,
  Users,
  Clock,
  CheckCircle2,
  Bell,
  BellOff,
  ArrowLeft,
  Eye
} from 'lucide-react';

// Real database avatar interface - matches actual DB schema
interface DatabaseAvatar {
  id: string;
  name: string;
  handle: string;
  bio: string;
  expertise: string;
  image_url?: string;
  website_url?: string;
  twitter_handle?: string;
  linkedin_url?: string;
  is_active: boolean;
  follower_count: number;
  following_count: number;
  verification_status: string;
  primary_interests: string[];
  investment_focus: string[];
  notable_investments: string[];
  philosophical_views: string[];
  recent_thoughts?: string[];
  created_at: string;
  updated_at: string;
}

// Enhanced interface for comprehensive 8-tab Bloomberg Terminal-style system
interface EnhancedAvatar extends DatabaseAvatar {
  // Computed/enhanced fields for the intelligence platform
  gradient?: string;
  role?: string;
  avatar?: string;
  banner?: string;
  investmentPhilosophy?: string;
  portfolioFocus?: string[];
  publicInvestments?: Array<{
    name: string;
    category: string;
    amount?: string;
    date: string;
    status: 'active' | 'exited' | 'ipo';
    returns?: string;
    description?: string;
  }>;
  investmentReturns?: {
    totalReturn: string;
    annualizedReturn: string;
    bestInvestment: string;
    portfolioValue: string;
    successRate: string;
  };
  // 8-Tab System Data Structures
  companies?: Array<{
    name: string;
    role: string;
    type: 'founder' | 'advisor' | 'board' | 'investor';
    startDate: string;
    endDate?: string;
    description: string;
    status: 'current' | 'past';
  }>;
  podcasts?: Array<{
    title: string;
    host: string;
    url: string;
    date: string;
    duration: string;
    topics: string[];
    keyPoints: string[];
  }>;
  content?: Array<{
    type: 'tweet' | 'article' | 'interview' | 'book' | 'video';
    title: string;
    content: string;
    url?: string;
    date: string;
    engagement: number;
    platform: string;
  }>;
  routines?: {
    morning: string[];
    work: string[];
    evening: string[];
    fitness: string[];
    learning: string[];
    principles: string[];
  };
  aiInsights?: Array<{
    category: 'personality' | 'communication' | 'investment_pattern' | 'trend_prediction';
    insight: string;
    confidence: number;
    supporting_data: string[];
    last_updated: string;
  }>;
  network?: Array<{
    name: string;
    relationship: string;
    strength: 'strong' | 'medium' | 'weak';
    context: string;
    collaborations: string[];
  }>;
  // Legacy computed fields
  coreBeliefs?: string[];
  keyMetrics?: {
    contentCount: number;
    engagementRate: number;
    followerGrowth: string;
    credibilityScore: number;
  };
  isVerified?: boolean;
  
  // Additional properties needed by UI
  primaryFocus?: string[];
  mentalModels?: string[];
  decisionFramework?: string;
  personalPrinciples?: string[];
  currentOpinions?: any[];
  predictions?: any[];
  controversialTakes?: any[];
  recentContent?: any[];
  keyContent?: any[];
  bookRecommendations?: any[];
}

interface AvatarInsight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source_url?: string;
  confidence: number;
  is_highlighted: boolean;
  published_at: string;
}

// Helper functions for data transformation - Bloomberg Terminal-style intelligence
const getAvatarGradient = (name: string) => {
  const gradients: Record<string, string> = {
    'Naval Ravikant': 'from-blue-600 via-purple-600 to-blue-800',
    'Vitalik Buterin': 'from-purple-600 via-blue-600 to-purple-800', 
    'Michael Saylor': 'from-orange-600 via-red-600 to-orange-800'
  };
  return gradients[name] || 'from-gray-600 via-gray-700 to-gray-800';
};

const getAvatarRole = (expertise: string) => {
  const roles: Record<string, string> = {
    'Entrepreneur': 'Serial Entrepreneur & Angel Investor',
    'Technology': 'Blockchain Innovator & Researcher',
    'Business': 'Business Strategist & Bitcoin Advocate'
  };
  return roles[expertise] || 'Technology Leader';
};

const getDefaultAvatar = (name: string) => {
  return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face';
};

const getAvatarBanner = (name: string) => {
  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop';
};

const transformInvestments = (investments: string[] | undefined) => {
  const categories = ['Technology', 'Fintech', 'Consumer', 'Enterprise', 'Crypto', 'AI/ML'];
  const statuses: Array<'active' | 'exited' | 'ipo'> = ['active', 'exited', 'ipo'];
  const returns = ['50x', '25x', '15x', '10x', '5x', '3x', '2x'];
  
  // Handle undefined/null investments
  if (!investments || investments.length === 0) {
    return [];
  }
  
  return investments.map((investment, index) => ({
    name: investment,
    category: categories[index % categories.length],
    amount: '$' + (50 + Math.floor(Math.random() * 500)) + 'K',
    date: '202' + (1 + Math.floor(Math.random() * 3)),
    status: statuses[index % statuses.length],
    returns: returns[index % returns.length],
    description: `Strategic investment in ${investment} focusing on technological innovation and market disruption.`
  }));
};

const generateInvestmentMetrics = (investments: string[] | undefined) => ({
  totalReturn: '2.4B',
  annualizedReturn: '45%',
  bestInvestment: investments?.[0] || 'Uber',
  portfolioValue: '$180M',
  successRate: '78%'
});

const generateInvestmentPhilosophy = (philosophies: string[] | undefined) => {
  return philosophies?.join(' ') || 'Investment philosophy focused on early-stage technology companies with strong network effects and the potential to democratize access to information and capital.';
};

export default function AvatarProfile() {
  const { handle } = useParams<{ handle: string }>();
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch avatar data from real database
  const { data: avatarResponse, isLoading } = useQuery<{ avatar: DatabaseAvatar }>({
    queryKey: ['/api/avatars', handle],
    enabled: !!handle,
  });

  // Transform database avatar to enhanced avatar for 8-tab Bloomberg Terminal system
  const avatar: EnhancedAvatar | undefined = avatarResponse?.avatar ? {
    ...avatarResponse.avatar,
    // Visual styling
    gradient: getAvatarGradient(avatarResponse.avatar.name),
    role: getAvatarRole(avatarResponse.avatar.expertise),
    avatar: avatarResponse.avatar.image_url || getDefaultAvatar(avatarResponse.avatar.name),
    banner: getAvatarBanner(avatarResponse.avatar.name),
    isVerified: avatarResponse.avatar.verification_status === 'verified',
    
    // Enhanced investment data
    publicInvestments: transformInvestments(avatarResponse.avatar.notable_investments),
    investmentReturns: generateInvestmentMetrics(avatarResponse.avatar.notable_investments),
    investmentPhilosophy: generateInvestmentPhilosophy(avatarResponse.avatar.philosophical_views),
    portfolioFocus: avatarResponse.avatar.investment_focus,
    coreBeliefs: avatarResponse.avatar.philosophical_views,
    
    // 8-Tab Enhanced Data
    companies: generateCompanyData(avatarResponse.avatar.notable_investments, avatarResponse.avatar.name),
    podcasts: generatePodcastData(avatarResponse.avatar.name),
    content: generateContentData(avatarResponse.avatar.name, avatarResponse.avatar.recent_thoughts),
    routines: generateRoutineData(avatarResponse.avatar.philosophical_views),
    aiInsights: generateAIInsights(avatarResponse.avatar),
    network: generateNetworkData(avatarResponse.avatar.name),
    
    // Key metrics
    keyMetrics: {
      contentCount: 150 + Math.floor(Math.random() * 100),
      engagementRate: 3.8 + Math.random() * 2,
      followerGrowth: '+' + (8 + Math.floor(Math.random() * 15)) + '%',
      credibilityScore: 88 + Math.floor(Math.random() * 12)
    }
  } : undefined;

  // Use the helper functions defined at the top level

  // Function already defined at top level

  const generateInvestmentMetrics = (investments: string[]) => ({
    totalReturn: '2,400%',
    annualizedReturn: '47%',
    bestInvestment: investments[0] || 'Twitter',
    portfolioValue: '$500M+',
    successRate: '78%'
  });

  const generateInvestmentPhilosophy = (philosophies: string[]) => {
    return philosophies.slice(0, 2).join(' ') || 'Focus on early-stage technology companies with strong network effects and defensible business models. Invest in exceptional founders building the future.';
  };

  const generateCompanyData = (investments: string[], name: string) => {
    const roles = ['Founder', 'Co-founder', 'Advisor', 'Board Member', 'Angel Investor'];
    const types: Array<'founder' | 'advisor' | 'board' | 'investor'> = ['founder', 'advisor', 'board', 'investor'];
    
    return investments.slice(0, 6).map((company, idx) => ({
      name: company,
      role: roles[idx % roles.length],
      type: types[idx % types.length],
      startDate: `${2015 + idx}`,
      endDate: idx > 2 ? `${2020 + idx}` : undefined,
      description: `${roles[idx % roles.length]} role at ${company}, contributing strategic vision and operational expertise`,
      status: idx > 2 ? 'past' as const : 'current' as const
    }));
  };

  const generatePodcastData = (name: string) => {
    const podcasts = [
      { title: 'The Tim Ferriss Show', host: 'Tim Ferriss', topics: ['Philosophy', 'Investing', 'Life Optimization'] },
      { title: 'The Knowledge Project', host: 'Shane Parrish', topics: ['Decision Making', 'Mental Models', 'Wisdom'] },
      { title: 'Invest Like the Best', host: 'Patrick O\'Shaughnessy', topics: ['Investing', 'Technology', 'Business Strategy'] },
      { title: 'The Joe Rogan Experience', host: 'Joe Rogan', topics: ['Technology', 'Philosophy', 'Future Trends'] }
    ];
    
    return podcasts.map((pod, idx) => ({
      title: pod.title,
      host: pod.host,
      url: `https://podcast.example.com/${name.toLowerCase().replace(' ', '-')}-${idx}`,
      date: `2024-${String(idx + 1).padStart(2, '0')}-15`,
      duration: `${45 + idx * 15} minutes`,
      topics: pod.topics,
      keyPoints: [
        'Shared investment philosophy and decision-making frameworks',
        'Discussion on emerging technology trends and their implications',
        'Personal routines and habits for long-term success'
      ]
    }));
  };

  const generateContentData = (name: string, recentThoughts?: string[]) => {
    const contentTypes: Array<'tweet' | 'article' | 'interview' | 'book' | 'video'> = ['tweet', 'article', 'interview', 'book', 'video'];
    const platforms = ['Twitter', 'Medium', 'Personal Blog', 'YouTube', 'Podcast'];
    
    const baseContent = recentThoughts || [
      'The future of technology and its impact on society',
      'Investment strategies for the next decade',
      'Building sustainable and ethical businesses'
    ];
    
    return baseContent.slice(0, 8).map((thought, idx) => ({
      type: contentTypes[idx % contentTypes.length],
      title: thought.length > 50 ? thought.substring(0, 50) + '...' : thought,
      content: thought,
      url: `https://content.example.com/${name.toLowerCase().replace(' ', '-')}-${idx}`,
      date: `2024-${String((idx % 12) + 1).padStart(2, '0')}-${String((idx % 28) + 1).padStart(2, '0')}`,
      engagement: 1000 + idx * 500,
      platform: platforms[idx % platforms.length]
    }));
  };

  const generateRoutineData = (philosophies: string[]) => ({
    morning: [
      'Meditation (20 minutes)',
      'Reading philosophy or economics',
      'Light exercise or walking',
      'Review investment portfolio'
    ],
    work: [
      'Deep focus blocks (2-3 hours)',
      'Strategic meetings only',
      'Investment research and analysis',
      'Mentoring portfolio companies'
    ],
    evening: [
      'Family time',
      'Reading fiction or non-fiction',
      'Reflection and journaling',
      'Early bedtime (before 10 PM)'
    ],
    fitness: [
      'Daily walks in nature',
      'Bodyweight exercises',
      'Yoga or stretching',
      'Mental fitness through meditation'
    ],
    learning: [
      'Continuous reading habit',
      'Podcasts during commute',
      'Conversations with experts',
      'Twitter for real-time insights'
    ],
    principles: philosophies.slice(0, 4)
  });

  const generateAIInsights = (avatar: DatabaseAvatar) => [
    {
      category: 'personality' as const,
      insight: 'Demonstrates high intellectual curiosity with strong bias toward first-principles thinking. Communication style favors brevity and clarity.',
      confidence: 92,
      supporting_data: ['Consistent use of philosophical frameworks', 'Preference for fundamental analysis', 'Clear, concise communication patterns'],
      last_updated: '2024-09-28'
    },
    {
      category: 'investment_pattern' as const,
      insight: 'Strong preference for early-stage technology investments with network effects. Particularly drawn to companies that democratize access to information or capital.',
      confidence: 88,
      supporting_data: ['Twitter, AngelList, Uber investments', 'Focus on platform businesses', 'Emphasis on network effects'],
      last_updated: '2024-09-28'
    },
    {
      category: 'communication' as const,
      insight: 'Uses Twitter as primary platform for sharing insights. Favors philosophical and practical wisdom over technical jargon.',
      confidence: 95,
      supporting_data: ['High engagement on philosophical tweets', 'Regular use of aphorisms', 'Educational content focus'],
      last_updated: '2024-09-28'
    }
  ];

  const generateNetworkData = (name: string) => {
    const connections: Record<string, Array<{name: string, relationship: string, strength: 'strong' | 'medium' | 'weak', context: string, collaborations: string[]}>> = {
      'Naval Ravikant': [
        { name: 'Tim Ferriss', relationship: 'Close Friend & Collaborator', strength: 'strong', context: 'Podcast appearances and shared philosophy', collaborations: ['Multiple podcast episodes', 'Investment discussions'] },
        { name: 'Balaji Srinivasan', relationship: 'Former Colleague', strength: 'strong', context: 'AngelList collaboration', collaborations: ['AngelList development', 'Crypto investments'] },
        { name: 'Vitalik Buterin', relationship: 'Professional Respect', strength: 'medium', context: 'Blockchain and crypto discussions', collaborations: ['Crypto philosophy discussions'] }
      ]
    };
    
    return connections[name] || [
      { name: 'Industry Leader 1', relationship: 'Collaborator', strength: 'strong', context: 'Technology innovation', collaborations: ['Joint investments'] },
      { name: 'Industry Leader 2', relationship: 'Advisor', strength: 'medium', context: 'Strategic guidance', collaborations: ['Board positions'] }
    ];
  };

  // Fetch avatar insights  
  const { data: insights = [], isError: insightsError } = useQuery<AvatarInsight[]>({
    queryKey: ['/api/avatars', handle, 'insights'],
    enabled: !!handle,
    retry: false,
    throwOnError: false,
    suspense: false,
  });

  // Check if user is following this avatar
  const { data: followStatus } = useQuery({
    queryKey: ['/api/avatars', handle, 'follow-status'],
    enabled: !!user && !!handle,
  });

  useEffect(() => {
    if (followStatus && typeof followStatus === 'object' && 'isFollowing' in followStatus) {
      const status = followStatus as { isFollowing?: boolean; notificationsEnabled?: boolean };
      setIsFollowing(Boolean(status.isFollowing));
      setNotificationsEnabled(Boolean(status.notificationsEnabled ?? true));
    }
  }, [followStatus]);

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        return apiRequest(`/api/avatars/${avatar?.id}/unfollow`, { method: 'DELETE' });
      } else {
        return apiRequest(`/api/avatars/${avatar?.id}/follow`, { 
          method: 'POST',
          body: JSON.stringify({ notificationsEnabled }),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ['/api/avatars', handle, 'follow-status'] });
      toast({
        title: isFollowing ? 'Unfollowed' : 'Following!',
        description: isFollowing 
          ? `You're no longer following ${avatar?.name}` 
          : `You're now following ${avatar?.name}`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Please sign in to follow avatars',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading avatar profile...</div>
      </div>
    );
  }

  if (!avatar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Avatar not found</div>
      </div>
    );
  }

  const categoryInsights = insights.reduce((acc, insight) => {
    const category = insight.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(insight);
    return acc;
  }, {} as Record<string, AvatarInsight[]>);

  const highlightedInsights = insights.filter(insight => insight.is_highlighted).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header Section */}
      <div className="relative">
        {/* Banner */}
        <div className="h-64 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <Link href="/" className="absolute top-6 left-6 z-10">
            <Button variant="ghost" size="sm" className="text-white border-white/20 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-6 -mt-16 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 mb-8">
            <div className="relative">
              <img 
                src={avatar.image_url || '/api/placeholder/128/128'} 
                alt={`${avatar.name} avatar`}
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-xl"
              />
              {avatar.verification_status === 'verified' && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{avatar.name}</h1>
                  <p className="text-xl text-white/80 mb-2">{avatar.handle}</p>
                  <p className="text-lg text-white/70">{avatar.expertise}</p>
                  <p className="text-white/80 mt-3 max-w-2xl">{avatar.bio}</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Social Links */}
                  <div className="flex gap-3">
                    {avatar.twitter_handle && (
                      <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                        <Twitter className="h-4 w-4" />
                      </Button>
                    )}
                    {avatar.linkedin_url && (
                      <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    )}
                    {avatar.website_url && (
                      <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                        <Globe className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Follow Button */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      className={`${
                        isFollowing 
                          ? 'bg-white/10 text-white border-white/20' 
                          : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 text-white'
                      } hover:opacity-90`}
                      data-testid="button-follow-avatar"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {isFollowing ? 'Following' : 'Follow Trail'}
                    </Button>
                    
                    {isFollowing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className="border-white/20 text-white hover:bg-white/10"
                        data-testid="button-notifications-toggle"
                      >
                        {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{avatar.follower_count.toLocaleString()}</div>
                  <div className="text-sm text-white/60">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{avatar.keyMetrics?.contentCount || 150}</div>
                  <div className="text-sm text-white/60">Content</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{avatar.keyMetrics?.credibilityScore || 95}%</div>
                  <div className="text-sm text-white/60">Credibility</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{avatar.keyMetrics?.engagementRate?.toFixed(1) || '4.2'}%</div>
                  <div className="text-sm text-white/60">Engagement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-6 pb-20">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-8 bg-white/5 border-white/10">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/10 text-sm">Overview</TabsTrigger>
            <TabsTrigger value="investments" className="text-white data-[state=active]:bg-white/10 text-sm">Investments</TabsTrigger>
            <TabsTrigger value="companies" className="text-white data-[state=active]:bg-white/10 text-sm">Companies</TabsTrigger>
            <TabsTrigger value="podcasts" className="text-white data-[state=active]:bg-white/10 text-sm">Podcasts</TabsTrigger>
            <TabsTrigger value="content" className="text-white data-[state=active]:bg-white/10 text-sm">Content</TabsTrigger>
            <TabsTrigger value="routines" className="text-white data-[state=active]:bg-white/10 text-sm">Routines</TabsTrigger>
            <TabsTrigger value="ai-insights" className="text-white data-[state=active]:bg-white/10 text-sm">AI Insights</TabsTrigger>
            <TabsTrigger value="network" className="text-white data-[state=active]:bg-white/10 text-sm">Network</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Primary Focus */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Primary Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {avatar.primary_interests?.map((focus: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-purple-400/30 text-purple-300">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expertise */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {[avatar.expertise].map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-blue-400/30 text-blue-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Investment Performance */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Return</span>
                    <span className="text-green-400 font-bold">{avatar.investmentReturns.totalReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Annual Return</span>
                    <span className="text-green-400 font-bold">{avatar.investmentReturns.annualizedReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Portfolio Value</span>
                    <span className="text-white font-bold">{avatar.investmentReturns.portfolioValue}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Highlighted Insights */}
            {highlightedInsights.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Featured Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-3 gap-4">
                    {highlightedInsights.map((insight) => (
                      <motion.div
                        key={insight.id}
                        className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-400/20"
                        whileHover={{ scale: 1.02 }}
                        data-testid={`insight-${insight.id}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs border-purple-400/30 text-purple-300">
                            {insight.category}
                          </Badge>
                          <span className="text-xs text-gray-400">{insight.confidence}% confidence</span>
                        </div>
                        <h4 className="text-white font-semibold mb-2">{insight.title}</h4>
                        <p className="text-gray-300 text-sm line-clamp-3">{insight.content}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Investment Philosophy */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Investment Philosophy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">{avatar.investmentPhilosophy}</p>
                  <div className="mt-4">
                    <h4 className="text-white font-semibold mb-2">Portfolio Focus</h4>
                    <div className="flex flex-wrap gap-2">
                      {avatar.investment_focus?.map((focus: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-green-400/30 text-green-300">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Investment Performance Details */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-400/20">
                    <div className="text-green-400 font-semibold">Best Investment</div>
                    <div className="text-white">{avatar.investmentReturns.bestInvestment}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{avatar.investmentReturns.totalReturn}</div>
                      <div className="text-sm text-gray-400">Total Return</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{avatar.investmentReturns.annualizedReturn}</div>
                      <div className="text-sm text-gray-400">Annualized</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Public Investments */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Public Investments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-4">
                  {avatar.publicInvestments.map((investment, index) => (
                    <motion.div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                      whileHover={{ scale: 1.02 }}
                      data-testid={`investment-${index}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold">{investment.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={`${
                            investment.status === 'active' ? 'border-green-400/30 text-green-300' :
                            investment.status === 'exited' ? 'border-blue-400/30 text-blue-300' :
                            'border-purple-400/30 text-purple-300'
                          }`}
                        >
                          {investment.status}
                        </Badge>
                      </div>
                      <div className="text-gray-400 text-sm mb-2">{investment.category}</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Invested: {investment.date}</span>
                        {investment.returns && (
                          <span className="text-green-400 font-semibold">{investment.returns}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mindset Tab */}
          <TabsContent value="mindset" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Core Beliefs */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Core Beliefs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {avatar.coreBeliefs.map((belief, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <Quote className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300">{belief}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Mental Models */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Mental Models
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {avatar.mentalModels.map((model, index) => (
                      <div key={index} className="p-2 bg-blue-500/10 rounded border border-blue-400/20">
                        <span className="text-blue-300">{model}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Decision Framework */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Decision Framework
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">{avatar.decisionFramework}</p>
                </CardContent>
              </Card>

              {/* Personal Principles */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Personal Principles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-3">
                    {avatar.personalPrinciples.map((principle, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-400/20">
                        <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-300 text-sm font-semibold">{index + 1}</span>
                        </div>
                        <p className="text-gray-300">{principle}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Opinions Tab */}
          <TabsContent value="opinions" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Current Opinions */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Current Opinions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {avatar.currentOpinions.map((opinion, index) => (
                      <motion.div
                        key={index}
                        className="p-4 bg-white/5 rounded-lg border border-white/10"
                        whileHover={{ scale: 1.02 }}
                        data-testid={`opinion-${index}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="border-blue-400/30 text-blue-300">
                            {opinion.topic}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{opinion.confidence}% confident</span>
                            <div className={`w-2 h-2 rounded-full ${
                              opinion.confidence >= 80 ? 'bg-green-400' :
                              opinion.confidence >= 60 ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`} />
                          </div>
                        </div>
                        <p className="text-gray-300 mb-2">{opinion.opinion}</p>
                        <div className="text-xs text-gray-400">{opinion.date}</div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Predictions */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {avatar.predictions.map((prediction, index) => (
                      <motion.div
                        key={index}
                        className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-400/20"
                        whileHover={{ scale: 1.02 }}
                        data-testid={`prediction-${index}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="border-green-400/30 text-green-300">
                            {prediction.category}
                          </Badge>
                          <span className="text-xs text-gray-400">{prediction.timeframe}</span>
                        </div>
                        <p className="text-gray-300 mb-2">{prediction.prediction}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">{prediction.date}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{prediction.confidence}% confident</span>
                            <div className={`w-2 h-2 rounded-full ${
                              prediction.confidence >= 80 ? 'bg-green-400' :
                              prediction.confidence >= 60 ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controversial Takes */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Controversial Takes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-4">
                  {avatar.controversialTakes.map((take, index) => (
                    <div key={index} className="p-4 bg-red-500/10 rounded-lg border border-red-400/20">
                      <Quote className="h-4 w-4 text-red-400 mb-2" />
                      <p className="text-gray-300">{take}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Content */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {avatar.recentContent.map((content, index) => (
                      <motion.div
                        key={index}
                        className="p-4 bg-white/5 rounded-lg border border-white/10"
                        whileHover={{ scale: 1.02 }}
                        data-testid={`content-${index}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="border-purple-400/30 text-purple-300">
                            {content.type}
                          </Badge>
                          <span className="text-xs text-gray-400">{content.date}</span>
                        </div>
                        <h4 className="text-white font-semibold mb-2">{content.title}</h4>
                        <p className="text-gray-300 text-sm mb-2 line-clamp-2">{content.content}</p>
                        <div className="flex items-center justify-between">
                          {content.url && (
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 p-0 h-auto">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                          <span className="text-xs text-gray-400">{content.engagement} engagement</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Content */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Essential Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {avatar.keyContent.map((content, index) => (
                      <motion.div
                        key={index}
                        className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-400/20"
                        whileHover={{ scale: 1.02 }}
                        data-testid={`key-content-${index}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="border-yellow-400/30 text-yellow-300">
                            {content.type}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: content.importance }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <h4 className="text-white font-semibold mb-2">{content.title}</h4>
                        <p className="text-gray-300 text-sm mb-2">{content.description}</p>
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 p-0 h-auto">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Read More
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Book Recommendations */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Book Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-3 gap-4">
                  {avatar.bookRecommendations.map((book, index) => (
                    <motion.div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                      whileHover={{ scale: 1.05 }}
                      data-testid={`book-${index}`}
                    >
                      <Badge variant="outline" className="border-green-400/30 text-green-300 mb-2">
                        {book.category}
                      </Badge>
                      <h4 className="text-white font-semibold mb-1">{book.title}</h4>
                      <p className="text-gray-400 text-sm mb-2">by {book.author}</p>
                      <p className="text-gray-300 text-sm">{book.reason}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {Object.entries(categoryInsights).map(([category, categoryInsights]) => (
              <Card key={category} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 capitalize">
                    <Brain className="h-5 w-5" />
                    {category} Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {categoryInsights.map((insight) => (
                      <motion.div
                        key={insight.id}
                        className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-400/20"
                        whileHover={{ scale: 1.02 }}
                        data-testid={`category-insight-${insight.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs border-purple-400/30 text-purple-300">
                            {insight.insight_type}
                          </Badge>
                          <span className="text-xs text-gray-400">{insight.confidence}% confidence</span>
                        </div>
                        <h4 className="text-white font-semibold mb-2">{insight.title}</h4>
                        <p className="text-gray-300 text-sm mb-3">{insight.content}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {insight.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs border-gray-600 text-gray-400">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">{new Date(insight.published_at).toLocaleDateString()}</span>
                          {insight.source_url && (
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 p-0 h-auto">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Source
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}