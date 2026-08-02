import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
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
  Brain,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';

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
  const { user } = useAuth();
  const [expandedAvatar, setExpandedAvatar] = useState<string | null>(null);

  const { data, isLoading } = useQuery<RecommendationsData>({
    queryKey: ['/api/recommendations/mixed'],
    refetchInterval: 60000, // Refresh every minute
    enabled: !!user,
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

  if (!user) {
    return (
      <section className="relative overflow-hidden bg-ink-page py-20">
        <div className="absolute inset-0 bg-accent-core/5" />
        
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Surface className="grad-surface overflow-hidden border border-ink-edge shadow-2xl shadow-accent-core/10">
              <div className="p-6 text-center sm:p-8 md:p-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-xl border border-accent-core/40 bg-accent-core/10 sm:mb-6 sm:h-24 sm:w-24">
                    <Lock className="h-10 w-10 text-accent-bright sm:h-12 sm:w-12" />
                  </div>
                  
                  <SectionTitle className="mb-6 sm:mb-8">AI-Powered Recommendations</SectionTitle>
                  <p className="text-sm text-secondary">Personalized insights for your interests</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="rounded-xl border border-accent-core/30 bg-accent-core/10 p-3 sm:p-4">
                      <Brain className="mx-auto mb-2 h-6 w-6 text-accent-bright sm:h-8 sm:w-8" />
                      <h3 className="mb-1 text-sm font-semibold text-primary sm:text-base">Smart Curation</h3>
                      <p className="text-xs text-secondary sm:text-sm">AI-powered content matching</p>
                    </div>
                    
                    <div className="rounded-xl border border-accent-core/30 bg-accent-core/10 p-3 sm:p-4">
                      <Users className="mx-auto mb-2 h-6 w-6 text-accent-bright sm:h-8 sm:w-8" />
                      <h3 className="mb-1 text-sm font-semibold text-primary sm:text-base">Top Influencers</h3>
                      <p className="text-xs text-secondary sm:text-sm">Follow thought leaders</p>
                    </div>
                    
                    <div className="rounded-xl border border-accent-core/30 bg-accent-core/10 p-3 sm:p-4">
                      <TrendingUp className="mx-auto mb-2 h-6 w-6 text-accent-bright sm:h-8 sm:w-8" />
                      <h3 className="mb-1 text-sm font-semibold text-primary sm:text-base">Trending Topics</h3>
                      <p className="text-xs text-secondary sm:text-sm">Stay ahead of the curve</p>
                    </div>
                  </div>

                  <Link href="/auth">
                    <Button 
                      size="lg"
                      className="grad-accent glow-accent w-full rounded-xl px-6 py-4 text-sm font-semibold text-primary shadow-lg transition-all duration-300 group sm:w-auto sm:px-8 sm:py-6 sm:text-base md:text-lg"
                      data-testid="button-login-recommendations"
                    >
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="whitespace-nowrap">Sign In to See Your Recommendations</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Button>
                  </Link>
                  
                    <p className="mt-3 px-2 text-xs text-secondary sm:mt-4 sm:text-sm">
                     Don't have an account? <Link href="/auth"><span className="cursor-pointer font-semibold text-accent-bright underline">Sign up for free</span></Link>
                  </p>
                </motion.div>
              </div>
            </Surface>
          </motion.div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="bg-ink-page py-20">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center space-x-3 mb-12">
            <div className="h-8 w-8 animate-pulse rounded-xl border-2 border-accent-core/30 bg-accent-core/10" />
            <p className="text-lg text-secondary">Generating personalized recommendations...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data || (data.avatars.length === 0 && data.content.length === 0)) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-ink-page py-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-accent-core/5" />
      
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <SectionTitle>AI-Powered Recommendations</SectionTitle>
          <p className="mt-2 text-secondary">Personalized insights for your interests</p>
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
              <TrendingUp className="h-5 w-5 text-warn" />
              <SectionTitle as="h3">Your Trending Topics</SectionTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.trendingTopics.map((topic, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-warn/30 bg-warn/10 px-4 py-2 text-sm font-medium text-warn"
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
                <Users className="h-6 w-6 text-accent-bright" />
                <SectionTitle as="h3">Recommended Influencers</SectionTitle>
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
                      <Surface
                        className="group cursor-pointer overflow-hidden border border-ink-edge transition-all duration-300 hover:border-accent-core/60 hover:bg-ink-raised"
                        onClick={() => handleAvatarClick(recommendation.id)}
                        data-testid={`recommendation-avatar-${avatar.handle}`}
                      >
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 ring-2 ring-blue-500/40 shadow-lg">
                              <AvatarImage src={avatar.imageUrl} alt={avatar.name} />
                              <AvatarFallback className="bg-accent-deep font-bold text-primary">
                                {avatar.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                              <h4 className="line-clamp-1 text-lg font-bold text-primary">
                                    {avatar.name}
                                  </h4>
                                  <p className="font-mono text-sm text-secondary">
                                    @{avatar.handle}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 rounded-xl bg-gain/10 px-2 py-1">
                                  <Star className="h-3 w-3 text-gain" />
                                  <span className="tabular text-xs font-mono text-gain">
                                    {Math.round(recommendation.score)}
                                  </span>
                                </div>
                              </div>

                              <Badge variant="secondary" className="mb-3 border border-accent-core/40 bg-ink-raised text-xs font-mono text-accent-bright">
                                {avatar.expertise}
                              </Badge>

                              <div className="space-y-1 mb-3">
                                {recommendation.reasons.slice(0, isExpanded ? undefined : 2).map((reason, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs text-body">
                                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent-bright" />
                                    <span>{reason}</span>
                                  </div>
                                ))}
                              </div>

                              <Button
                                size="sm"
                                className="grad-accent w-full rounded-xl text-xs font-mono uppercase tracking-wider text-primary"
                                data-testid={`button-follow-recommendation-${avatar.handle}`}
                              >
                                <Users className="h-3 w-3 mr-1" />
                                Track Influencer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Surface>
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
                <FileText className="h-6 w-6 text-accent-bright" />
                <SectionTitle as="h3">Recommended Content</SectionTitle>
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
                      <Surface
                        className="group cursor-pointer border border-ink-edge transition-all duration-300 hover:border-accent-core/60 hover:bg-ink-raised"
                        onClick={() => handleContentClick(recommendation.id)}
                        data-testid={`recommendation-content-${recommendation.id}`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="line-clamp-2 flex-1 text-sm font-semibold text-primary">
                              {content.title}
                            </h4>
                            <div className="flex shrink-0 items-center gap-1 rounded-xl bg-accent-core/10 px-2 py-0.5">
                              <Star className="h-2.5 w-2.5 text-accent-bright" />
                              <span className="tabular text-xs font-mono text-accent-bright">
                                {Math.round(recommendation.score)}
                              </span>
                            </div>
                          </div>

                          {content.description && (
                            <p className="mb-3 line-clamp-2 text-xs text-secondary">
                              {content.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                              {content.tags?.slice(0, 2).map((tag: string, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="border-accent-core/30 bg-accent-core/10 px-2 py-0.5 text-xs text-accent-bright"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <ChevronRight className="h-4 w-4 text-accent-bright transition-transform group-hover:translate-x-1" />
                          </div>

                          {recommendation.reasons.length > 0 && (
                            <div className="mt-3 border-t border-ink-divider pt-3">
                              <p className="flex items-center gap-1 text-xs text-secondary">
                                <Brain className="h-3 w-3" />
                                {recommendation.reasons[0]}
                              </p>
                            </div>
                          )}
                        </div>
                      </Surface>
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
