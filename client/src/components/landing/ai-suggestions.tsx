import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, TrendingUp, Loader2, Video, Mic, FileText, Clock, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useState } from "react";

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
  const [activeTab, setActiveTab] = useState<'suggested' | 'ai-picks' | 'trending'>('suggested');

  const { data, isLoading, error } = useQuery<{ success: boolean } & MixedRecommendations>({
    queryKey: ['/api/recommendations/mixed'],
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (!isAuthenticated || !user) {
    return (
      <section id="suggestions" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
              
              <div className="relative glass-bg backdrop-blur-2xl border border-white/10 rounded-3xl p-12">
                <div className="flex justify-center mb-8">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
                    <Brain className="w-14 h-14 text-purple-300" />
                  </div>
                </div>

                <h3 className="text-3xl font-bold text-center mb-4 text-white">
                  Unlock Personalized Recommendations
                </h3>
                
                <p className="text-lg text-gray-400 text-center mb-10 max-w-xl mx-auto">
                  Sign in to get AI-powered content recommendations tailored to your interests and followed avatars
                </p>

                <div className="flex justify-center">
                  <Link href="/auth">
                    <motion.button 
                      className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      data-testid="button-signin"
                    >
                      Sign In to Continue
                    </motion.button>
                  </Link>
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
      <section id="suggestions" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
          </motion.div>
          
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            <span className="ml-4 text-gray-400 text-lg">Loading your recommendations...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data?.success) {
    return (
      <section id="suggestions" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Follow some knowledge avatars to get personalized recommendations
            </p>
            <Link href="/discover">
              <button 
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/30"
                data-testid="button-discover"
              >
                Discover Avatars
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    );
  }

  const { content } = data;

  if (!content || content.length === 0) {
    return (
      <section id="suggestions" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              No recommendations yet. Process some content or follow knowledge avatars to get started!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/discover">
                <button 
                  className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/30"
                  data-testid="button-discover-avatars"
                >
                  Discover Avatars
                </button>
              </Link>
              <button 
                onClick={() => document.getElementById('ai-processor')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 glass-bg backdrop-blur-xl border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/60 rounded-xl font-semibold transition-all duration-300"
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

  const suggestedContent = content.slice(0, 6);
  const agentPicks = content.slice(6, 12);
  const trendingContent = content.slice(12, 18);

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
      return "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&h=400&fit=crop";
    } else if (contentType === 'video') {
      return "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&h=400&fit=crop";
    }
    return "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop";
  };

  const tabs = [
    { id: 'suggested' as const, label: 'Suggested for You', icon: Sparkles, items: suggestedContent },
    { id: 'ai-picks' as const, label: 'AI Agent Picks', icon: Brain, items: agentPicks },
    { id: 'trending' as const, label: 'Trending Now', icon: TrendingUp, items: trendingContent }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const currentItems = activeTabData?.items || [];

  return (
    <section id="suggestions" className="py-24 relative overflow-hidden">
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
            AI-Powered Suggestions
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Intelligent content recommendations based on your interests
          </p>
        </motion.div>
        
        {/* Modern Tab Navigation */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 glass-bg backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-cyan-300' : ''}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
        
        {/* Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {currentItems.map((rec, index) => {
              const ContentIcon = getContentTypeIcon(rec.data);
              const contentTypeLabel = getContentTypeLabel(rec.data);
              const duration = formatDuration(rec.data);
              const thumbnail = getThumbnail(rec.data);
              
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <Link href={`/summary/${rec.id}`}>
                    <Card 
                      className="group glass-bg backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 transition-all duration-500 cursor-pointer overflow-hidden h-full"
                      data-testid={`card-suggestion-${rec.id}`}
                    >
                      <CardContent className="p-0">
                        {/* Large Thumbnail */}
                        <div className="relative overflow-hidden aspect-video">
                          <img 
                            src={thumbnail} 
                            alt={rec.data.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          
                          {/* Hover Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
                              <Play className="w-7 h-7 text-white ml-1" />
                            </div>
                          </div>
                          
                          {/* Content Type Badge */}
                          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 glass-bg backdrop-blur-xl border border-white/20 rounded-full">
                            <ContentIcon className="w-3.5 h-3.5 text-cyan-300" />
                            <span className="text-xs font-medium text-white">{contentTypeLabel}</span>
                          </div>
                          
                          {/* Duration */}
                          {duration && (
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 glass-bg backdrop-blur-xl border border-white/20 rounded-full">
                              <Clock className="w-3.5 h-3.5 text-white" />
                              <span className="text-xs font-medium text-white">{duration}</span>
                            </div>
                          )}
                          
                          {/* Match Score */}
                          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-gradient-to-r from-cyan-500/90 to-purple-500/90 backdrop-blur-xl border border-white/20 rounded-full">
                            <span className="text-xs font-bold text-white">{Math.round(rec.score)}% Match</span>
                          </div>
                        </div>
                        
                        {/* Content Info */}
                        <div className="p-6 space-y-3">
                          <h4 className="font-bold text-white text-lg leading-tight line-clamp-2 group-hover:text-cyan-300 transition-colors">
                            {rec.data.title}
                          </h4>
                          
                          {rec.reasons[0] && (
                            <p className="text-sm text-gray-400 line-clamp-2 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-400" />
                              <span>{rec.reasons[0]}</span>
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {currentItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex p-6 rounded-2xl glass-bg backdrop-blur-xl border border-white/10 mb-6">
              <Sparkles className="w-12 h-12 text-gray-500" />
            </div>
            <p className="text-xl text-gray-400">No recommendations available yet</p>
            <p className="text-sm text-gray-500 mt-2">Process more content or follow avatars to get personalized suggestions</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
