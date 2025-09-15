import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  BookOpen,
  MessageSquare,
  Users,
  Heart,
  Repeat2,
  Link2,
  Sparkles,
  BarChart3,
  Shield,
  Star,
  ExternalLink,
  Crown,
  Zap,
  Globe,
  GraduationCap,
  Target,
  Clock,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  FileText,
  Video,
  Mic
} from 'lucide-react';

interface LeaderEducation {
  profile: {
    fid: number;
    username: string;
    displayName: string;
    bio: string;
    pfpUrl: string;
    followerCount: number;
    followingCount: number;
    role: string;
    expertise: string[];
    keyTakeaways: string[];
    ecosystem: string[];
  };
  notableCasts: Array<{
    hash: string;
    text: string;
    whyItMatters: string;
    concepts: string[];
    priority: number;
  }>;
  resources: Array<{
    title: string;
    url: string;
    description: string;
    type: 'article' | 'talk' | 'thread' | 'website';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    priority: number;
  }>;
  topics: Array<{
    name: string;
    definition: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>;
  engagement: {
    avgLikes: number;
    avgRecasts: number;
    totalEngagement: number;
  };
}

export function TrendingSocialContent() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedLeader, setSelectedLeader] = useState<LeaderEducation | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch educational data for crypto leaders
  const { data: educationData, isLoading, error } = useQuery({
    queryKey: ['/api/education/leaders'],
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2
  });

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getCryptoIcon = (context: string | string[]) => {
    const contextStr = Array.isArray(context) ? context.join(' ').toLowerCase() : context?.toLowerCase() || '';
    if (contextStr.includes('ethereum')) return '🔷';
    if (contextStr.includes('farcaster')) return '🚀';
    if (contextStr.includes('base') || contextStr.includes('coinbase')) return '🔵';
    if (contextStr.includes('bitcoin')) return '🟠';
    return '⚡';
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
      intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[difficulty as keyof typeof colors] || colors.beginner;
  };

  const getResourceIcon = (type: string) => {
    switch(type) {
      case 'article': return <FileText className="w-4 h-4" />;
      case 'talk': return <Video className="w-4 h-4" />;
      case 'thread': return <MessageSquare className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      default: return <Link2 className="w-4 h-4" />;
    }
  };

  const leaders = (educationData as any)?.leaders || [];

  // If a leader is selected, show detailed education view
  if (selectedLeader) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-green-500/5 rounded-3xl" />
        
        <div className="relative z-10">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedLeader(null)}
              className="hover:bg-white/10"
              data-testid="button-back-leaders"
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Back to Leaders
            </Button>
            <div className="flex items-center gap-4">
              <img 
                src={selectedLeader.profile.pfpUrl} 
                alt={selectedLeader.profile.displayName}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {selectedLeader.profile.displayName}
                </h1>
                <p className="text-muted-foreground">{selectedLeader.profile.role}</p>
              </div>
            </div>
          </div>

          {/* Educational Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/5 backdrop-blur-sm">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <Users className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="casts" data-testid="tab-casts">
                <MessageSquare className="w-4 h-4 mr-2" />
                Notable Casts
              </TabsTrigger>
              <TabsTrigger value="concepts" data-testid="tab-concepts">
                <Lightbulb className="w-4 h-4 mr-2" />
                Key Concepts
              </TabsTrigger>
              <TabsTrigger value="resources" data-testid="tab-resources">
                <BookOpen className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="p-8 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/20">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        Profile
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={selectedLeader.profile.pfpUrl} 
                            alt={selectedLeader.profile.displayName}
                            className="w-16 h-16 rounded-full"
                          />
                          <div>
                            <p className="font-medium">@{selectedLeader.profile.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFollowerCount(selectedLeader.profile.followerCount)} followers
                            </p>
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {selectedLeader.profile.bio}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Expertise Areas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLeader.profile.expertise.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Key Learning Takeaways
                      </h4>
                      <ul className="space-y-3">
                        {selectedLeader.profile.keyTakeaways.map((takeaway, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Engagement Metrics
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-lg font-semibold text-blue-400">{selectedLeader.engagement.avgLikes}</div>
                          <div className="text-xs text-muted-foreground">Avg Likes</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-lg font-semibold text-green-400">{selectedLeader.engagement.avgRecasts}</div>
                          <div className="text-xs text-muted-foreground">Avg Recasts</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-lg font-semibold text-purple-400">{selectedLeader.engagement.totalEngagement}</div>
                          <div className="text-xs text-muted-foreground">Total Engagement</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Notable Casts Tab */}
            <TabsContent value="casts" className="space-y-4">
              {selectedLeader.notableCasts.map((cast, i) => (
                <Card key={i} className="p-6 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <img 
                        src={selectedLeader.profile.pfpUrl} 
                        alt={selectedLeader.profile.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="font-medium text-sm">@{selectedLeader.profile.username}</p>
                          <p className="text-foreground mt-2 leading-relaxed">{cast.text}</p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-4 rounded-lg">
                          <h5 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Why This Matters
                          </h5>
                          <p className="text-sm text-muted-foreground leading-relaxed">{cast.whyItMatters}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {cast.concepts.map((concept, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            {/* Key Concepts Tab */}
            <TabsContent value="concepts" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {selectedLeader.topics.map((topic, i) => (
                  <Card key={i} className="p-6 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/20">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{topic.name}</h4>
                        <Badge className={getDifficultyBadge(topic.difficulty)}>
                          {topic.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {topic.definition}
                      </p>
                      <Badge variant="outline" className="text-xs w-fit">
                        {topic.category}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4">
              {selectedLeader.resources
                .sort((a, b) => a.priority - b.priority)
                .map((resource, i) => (
                <Card key={i} className="p-6 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/20">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-blue-400 mt-1">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-2">{resource.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {resource.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {resource.type}
                            </Badge>
                            <Badge className={getDifficultyBadge(resource.difficulty)}>
                              {resource.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(resource.url, '_blank')}
                        className="hover:bg-white/10"
                        data-testid={`link-resource-${i}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    );
  }

  // Main leaders overview
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-green-500/5 rounded-3xl" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl opacity-20" />
      
      <div className="relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-2">
              <GraduationCap className="w-4 h-4 mr-2" />
              Crypto Leaders Learning Hub
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-6">
              Learn from Crypto Pioneers
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Discover insights, concepts, and resources from the most influential builders and thought leaders in crypto
            </p>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-8 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gradient-to-r from-muted/80 to-muted/40 rounded animate-pulse" />
                        <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded animate-pulse" />
                      <div className="h-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded w-5/6 animate-pulse" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-16 text-center bg-gradient-to-br from-red-500/5 via-card/60 to-card/40 backdrop-blur-xl border border-red-500/20 shadow-2xl max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Content Loading Issue</h3>
              <p className="text-muted-foreground mb-8">
                We're having trouble loading the educational content right now. Please try again in a moment.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                data-testid="button-retry-content"
              >
                Try Again
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leaders.slice(0, 6).map((leader: LeaderEducation, index: number) => (
              <motion.div
                key={leader.profile.fid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="group p-8 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer hover:scale-105 hover:border-white/30"
                  onClick={() => setSelectedLeader(leader)}
                  data-testid={`card-leader-${leader.profile.fid}`}
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={leader.profile.pfpUrl} 
                          alt={leader.profile.displayName}
                          className="w-16 h-16 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                        />
                        <div className="absolute -top-1 -right-1 text-lg">
                          {getCryptoIcon(leader.profile.ecosystem)}
                        </div>
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground group-hover:text-blue-400 transition-colors">
                            {leader.profile.displayName}
                          </h3>
                          <Shield className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-sm text-blue-400 font-medium">{leader.profile.role}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {formatFollowerCount(leader.profile.followerCount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <Target className="w-3 h-3" />
                          Expertise
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {leader.profile.expertise.slice(0, 2).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {skill}
                            </Badge>
                          ))}
                          {leader.profile.expertise.length > 2 && (
                            <Badge variant="secondary" className="text-xs bg-muted/20 text-muted-foreground border-muted/30">
                              +{leader.profile.expertise.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <BookOpen className="w-3 h-3" />
                          Learning Content
                        </h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-white/5 rounded text-xs">
                            <div className="font-semibold text-green-400">{leader.notableCasts.length}</div>
                            <div className="text-muted-foreground">Casts</div>
                          </div>
                          <div className="p-2 bg-white/5 rounded text-xs">
                            <div className="font-semibold text-blue-400">{leader.topics.length}</div>
                            <div className="text-muted-foreground">Topics</div>
                          </div>
                          <div className="p-2 bg-white/5 rounded text-xs">
                            <div className="font-semibold text-purple-400">{leader.resources.length}</div>
                            <div className="text-muted-foreground">Resources</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-foreground border border-white/20 hover:border-white/30 group-hover:shadow-lg transition-all duration-300"
                        data-testid={`button-explore-${leader.profile.fid}`}
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Explore Learning Content
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}