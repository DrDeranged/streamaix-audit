import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  FileText, 
  ChevronRight,
  Star,
  Zap,
  Brain
} from 'lucide-react';
import { useState } from 'react';
import { queryClient } from '@/lib/queryClient';

interface RecommendationScore {
  id: string;
  type: 'avatar' | 'content';
  score: number;
  reasons: string[];
  data: any;
}

interface RecommendationsData {
  avatars: RecommendationScore[];
  content: RecommendationScore[];
  trendingTopics: string[];
}

export function AIRecommendations() {
  const [expandedAvatar, setExpandedAvatar] = useState<string | null>(null);

  const { data, isLoading } = useQuery<RecommendationsData>({
    queryKey: ['/api/recommendations/mixed'],
    refetchInterval: 60000, // Refresh every minute
  });

  const trackClickMutation = useMutation({
    mutationFn: async ({ recommendationId, recommendationType }: { recommendationId: string; recommendationType: 'avatar' | 'content' }) => {
      const response = await fetch('/api/recommendations/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId, recommendationType }),
      });
      if (!response.ok) throw new Error('Failed to track click');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/mixed'] });
    },
  });

  const handleAvatarClick = (avatarId: string) => {
    trackClickMutation.mutate({ recommendationId: avatarId, recommendationType: 'avatar' });
    setExpandedAvatar(expandedAvatar === avatarId ? null : avatarId);
  };

  const handleContentClick = (contentId: string) => {
    trackClickMutation.mutate({ recommendationId: contentId, recommendationType: 'content' });
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center space-x-3 mb-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500/30 border-t-blue-500" />
            <p className="text-lg text-muted-foreground">Generating personalized recommendations...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data || (data.avatars.length === 0 && data.content.length === 0)) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5" />
      
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              AI-Powered Recommendations
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Personalized insights based on your interests and behavior
          </p>
        </motion.div>

        {/* Trending Topics */}
        {data.trendingTopics && data.trendingTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">Your Trending Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.trendingTopics.map((topic, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400 px-4 py-2 text-sm font-medium"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {topic}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recommended Avatars */}
          {data.avatars && data.avatars.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-bold">Recommended Influencers</h3>
                <Badge variant="secondary" className="ml-auto">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Curated
                </Badge>
              </div>

              <div className="space-y-4">
                {data.avatars.map((recommendation, index) => {
                  const avatar = recommendation.data;
                  const isExpanded = expandedAvatar === recommendation.id;

                  return (
                    <motion.div
                      key={recommendation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card
                        className="group cursor-pointer bg-gradient-to-br from-slate-950/95 via-blue-950/90 to-slate-900/95 backdrop-blur-xl border-2 border-blue-500/30 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 overflow-hidden"
                        onClick={() => handleAvatarClick(recommendation.id)}
                        data-testid={`recommendation-avatar-${avatar.handle}`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 ring-2 ring-blue-500/40 shadow-lg">
                              <AvatarImage src={avatar.imageUrl} alt={avatar.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                                {avatar.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h4 className="font-bold text-blue-50 text-lg line-clamp-1">
                                    {avatar.name}
                                  </h4>
                                  <p className="text-sm text-blue-400/70 font-mono">
                                    @{avatar.handle}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-full">
                                  <Star className="h-3 w-3 text-emerald-400" />
                                  <span className="text-xs font-mono text-emerald-400">
                                    {Math.round(recommendation.score)}
                                  </span>
                                </div>
                              </div>

                              <Badge variant="secondary" className="bg-slate-900/80 text-blue-300 border-blue-500/40 text-xs font-mono mb-3">
                                {avatar.expertise}
                              </Badge>

                              <div className="space-y-1 mb-3">
                                {recommendation.reasons.slice(0, isExpanded ? undefined : 2).map((reason, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs text-blue-200/80">
                                    <ChevronRight className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <span>{reason}</span>
                                  </div>
                                ))}
                              </div>

                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-mono uppercase tracking-wider"
                                data-testid={`button-follow-recommendation-${avatar.handle}`}
                              >
                                <Users className="h-3 w-3 mr-1" />
                                Track Influencer
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Recommended Content */}
          {data.content && data.content.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <h3 className="text-2xl font-bold">Recommended Content</h3>
                <Badge variant="secondary" className="ml-auto">
                  <Sparkles className="h-3 w-3 mr-1" />
                  For You
                </Badge>
              </div>

              <div className="space-y-3">
                {data.content.slice(0, 5).map((recommendation, index) => {
                  const content = recommendation.data;

                  return (
                    <motion.div
                      key={recommendation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card
                        className="group cursor-pointer bg-gradient-to-br from-slate-950/90 via-purple-950/85 to-slate-900/90 backdrop-blur-xl border-2 border-purple-500/30 hover:border-purple-400/60 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
                        onClick={() => handleContentClick(recommendation.id)}
                        data-testid={`recommendation-content-${recommendation.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="font-semibold text-purple-50 text-sm line-clamp-2 flex-1">
                              {content.title}
                            </h4>
                            <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                              <Star className="h-2.5 w-2.5 text-purple-400" />
                              <span className="text-xs font-mono text-purple-400">
                                {Math.round(recommendation.score)}
                              </span>
                            </div>
                          </div>

                          {content.description && (
                            <p className="text-xs text-purple-200/70 line-clamp-2 mb-3">
                              {content.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                              {content.tags?.slice(0, 2).map((tag: string, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="bg-purple-500/10 border-purple-500/30 text-purple-300 text-xs px-2 py-0.5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <ChevronRight className="h-4 w-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                          </div>

                          {recommendation.reasons.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-purple-500/20">
                              <p className="text-xs text-purple-300/80 flex items-center gap-1">
                                <Brain className="h-3 w-3" />
                                {recommendation.reasons[0]}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
