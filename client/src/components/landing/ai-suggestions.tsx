import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, TrendingUp, Loader2, Video, Mic, FileText, ExternalLink, Clock, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface RecommendationScore {
  id: string;
  type: 'avatar' | 'content';
  score: number;
  reasons: string[];
  data: any;
}

interface MixedRecommendations {
  avatars: RecommendationScore[];
  content: RecommendationScore[];
  trendingTopics: string[];
}

export function AISuggestions() {
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery<{ success: boolean } & MixedRecommendations>({
    queryKey: ['/api/recommendations/mixed'],
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (!isAuthenticated || !user) {
    return (
      <section id="suggestions" className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-orange-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              
              <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-orange-500/5" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
                      <div className="relative bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-4 rounded-2xl border border-white/20">
                        <Brain className="w-12 h-12 text-purple-300" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-center mb-4 bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent">
                    Unlock Personalized Recommendations
                  </h3>
                  
                  <p className="text-base sm:text-lg text-gray-300 text-center mb-8 max-w-2xl mx-auto">
                    Sign in to get AI-powered content recommendations tailored to your interests, viewing history, and followed knowledge avatars
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <motion.div 
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white text-sm mb-1">Smart Matching</div>
                        <div className="text-xs text-gray-400">AI analyzes your preferences and behavior patterns</div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                    >
                      <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white text-sm mb-1">Trending Topics</div>
                        <div className="text-xs text-gray-400">Stay updated with relevant content</div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                    >
                      <BarChart3 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white text-sm mb-1">Deep Insights</div>
                        <div className="text-xs text-gray-400">Discover content you'll love</div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex justify-center">
                    <Link href="/auth">
                      <motion.button 
                        className="relative px-10 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-purple-500/30 overflow-hidden group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        data-testid="button-signin"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Sign In to Get Started
                        </span>
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="suggestions" className="py-12 sm:py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Intelligent content recommendations based on your interests and social graph
            </p>
          </motion.div>
          
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="ml-3 text-gray-400">Loading personalized recommendations...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data?.success) {
    return (
      <section id="suggestions" className="py-12 sm:py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Follow some knowledge avatars to get personalized recommendations
            </p>
            <div className="mt-8">
              <Link href="/discover">
                <button 
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/50"
                  data-testid="button-discover"
                >
                  Discover Avatars
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const { content, trendingTopics } = data;

  if (!content || content.length === 0) {
    return (
      <section id="suggestions" className="py-12 sm:py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 dark:text-gray-300 max-w-2xl mx-auto px-4 mb-6">
              No recommendations yet. Process some content or follow knowledge avatars to get started!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/discover">
                <button 
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/50"
                  data-testid="button-discover-avatars"
                >
                  Discover Avatars
                </button>
              </Link>
              <button 
                onClick={() => document.getElementById('ai-processor')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-3 backdrop-blur-xl bg-white/5 border-2 border-indigo-400/50 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-400 rounded-xl font-semibold transition-all duration-300"
                data-testid="button-process-content"
              >
                Process Content
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const suggestedContent = content.slice(0, 4);
  const agentPicks = content.slice(4, 8);
  const trendingContent = content.slice(8, 12);

  const getContentTypeIcon = (summary: any) => {
    const contentType = summary.contentType?.toLowerCase() || '';
    const platform = summary.platform?.toLowerCase() || '';
    
    if (contentType === 'podcast' || platform.includes('podcast') || platform.includes('spotify')) {
      return Mic;
    } else if (contentType === 'video' || platform === 'youtube') {
      return Video;
    }
    return FileText;
  };

  const getContentTypeLabel = (summary: any) => {
    const contentType = summary.contentType?.toLowerCase() || '';
    const platform = summary.platform?.toLowerCase() || '';
    
    if (contentType === 'podcast' || platform.includes('podcast')) {
      return 'Podcast';
    } else if (contentType === 'video' || platform === 'youtube') {
      return 'Video';
    }
    return 'Article';
  };

  const formatDuration = (summary: any) => {
    if (summary.duration) {
      const minutes = Math.round(summary.duration / 60);
      return `${minutes} min`;
    }
    if (summary.originalDuration) {
      const minutes = Math.round(summary.originalDuration / 60);
      return `${minutes} min`;
    }
    return null;
  };

  const getThumbnail = (summary: any) => {
    if (summary.thumbnailUrl) return summary.thumbnailUrl;
    
    const contentType = summary.contentType?.toLowerCase() || '';
    if (contentType === 'podcast') {
      return "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=200&fit=crop";
    } else if (contentType === 'video') {
      return "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=200&fit=crop";
    }
    return "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop";
  };

  const suggestions = [
    {
      icon: Sparkles,
      title: "Suggested for You",
      gradientFrom: "from-indigo-500/20",
      gradientTo: "to-purple-500/20",
      borderColor: "border-indigo-500/30",
      iconColor: "text-indigo-400",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      items: suggestedContent
    },
    {
      icon: Brain,
      title: "Your AI Agent Recommends",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-pink-500/20",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      items: agentPicks
    },
    {
      icon: TrendingUp,
      title: "Trending Content",
      gradientFrom: "from-cyan-500/20",
      gradientTo: "to-blue-500/20",
      borderColor: "border-cyan-500/30",
      iconColor: "text-cyan-400",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      items: trendingContent
    }
  ];

  return (
    <section id="suggestions" className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            AI-Powered Suggestions
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Intelligent content recommendations based on your interests and followed avatars
          </p>
          {trendingTopics.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2 px-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" />
                Trending:
              </span>
              {trendingTopics.slice(0, 5).map((topic, idx) => (
                <motion.span
                  key={topic}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-xs px-3 py-1.5 backdrop-blur-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/30 text-indigo-300 rounded-full font-medium"
                  data-testid={`tag-trending-${idx}`}
                >
                  {topic}
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {suggestions.map((section, sectionIndex) => (
            section.items.length > 0 && (
              <motion.div 
                key={section.title}
                className="space-y-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: sectionIndex * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg backdrop-blur-xl bg-gradient-to-br ${section.gradientFrom} ${section.gradientTo} border ${section.borderColor}`}>
                    <section.icon className={`w-5 h-5 ${section.iconColor}`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-orbitron font-bold text-white">
                    {section.title}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {section.items.map((rec, itemIndex) => {
                    const ContentIcon = getContentTypeIcon(rec.data);
                    const contentTypeLabel = getContentTypeLabel(rec.data);
                    const duration = formatDuration(rec.data);
                    const thumbnail = getThumbnail(rec.data);
                    
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <Link href={`/summary/${rec.id}`}>
                          <Card 
                            className={`group backdrop-blur-xl bg-gradient-to-br ${section.gradientFrom} ${section.gradientTo} border ${section.borderColor} hover:border-opacity-60 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl`}
                            data-testid={`card-suggestion-${rec.id}`}
                          >
                            <CardContent className="p-0">
                              <div className="relative overflow-hidden">
                                <img 
                                  src={thumbnail} 
                                  alt={rec.data.title} 
                                  className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop";
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                
                                {/* Content Type Badge */}
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-xl bg-black/50 border border-white/20 rounded-full">
                                  <ContentIcon className="w-3.5 h-3.5 text-white" />
                                  <span className="text-xs font-medium text-white">{contentTypeLabel}</span>
                                </div>
                                
                                {/* Duration */}
                                {duration && (
                                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 backdrop-blur-xl bg-black/50 border border-white/20 rounded-full">
                                    <Clock className="w-3 h-3 text-white" />
                                    <span className="text-xs font-medium text-white">{duration}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-4 space-y-3">
                                <h4 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-indigo-200 transition-colors">
                                  {rec.data.title}
                                </h4>
                                
                                {rec.reasons[0] && (
                                  <p className="text-xs text-gray-400 dark:text-gray-300 italic line-clamp-2 flex items-start gap-1.5">
                                    <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-indigo-400" />
                                    <span>{rec.reasons[0]}</span>
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                  <span className={`text-xs px-2.5 py-1 rounded-full border ${section.badgeColor} font-medium`}>
                                    {Math.round(rec.score)}% match
                                  </span>
                                  <ExternalLink className={`w-4 h-4 ${section.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )
          ))}
        </div>
      </div>
    </section>
  );
}
