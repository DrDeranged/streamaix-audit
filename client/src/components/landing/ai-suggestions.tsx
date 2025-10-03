import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Loader2, 
  Video, 
  Mic, 
  FileText, 
  Clock, 
  BookOpen,
  Users,
  TrendingDown,
  DollarSign,
  ExternalLink,
  BarChart3,
  ArrowUpRight,
  Star,
  Play
} from "lucide-react";
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

interface Book {
  title: string;
  author: string;
  avatarName: string;
  category?: string;
}

interface Podcast {
  title: string;
  guest: string;
  avatarName: string;
  url?: string;
}

interface AlignedAsset {
  symbol: string;
  name: string;
  reason: string;
  type: 'crypto' | 'stock';
}

interface MixedRecommendations {
  avatars: RecommendationScore[];
  content: RecommendationScore[];
  trendingTopics: string[];
  books: Book[];
  podcasts: Podcast[];
  alignedAssets: AlignedAsset[];
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
            <span className="ml-4 text-gray-400 text-lg">Analyzing your preferences...</span>
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

  const { content, avatars, books, podcasts, alignedAssets, trendingTopics } = data;

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

  const formatDuration = (summary: any) => {
    if (summary.duration) {
      const minutes = Math.round(summary.duration / 60);
      return `${minutes}min`;
    }
    if (summary.originalDuration) {
      const minutes = Math.round(summary.originalDuration / 60);
      return `${minutes}min`;
    }
    return null;
  };

  const getThumbnail = (summary: any) => {
    if (summary.thumbnailUrl) return summary.thumbnailUrl;
    
    const contentType = summary.contentType?.toLowerCase() || '';
    if (contentType === 'podcast') {
      return "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop";
    } else if (contentType === 'video') {
      return "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop";
    }
    return "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop";
  };

  const topContent = content.slice(0, 3);
  const topAvatars = avatars.slice(0, 3);

  return (
    <section id="suggestions" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Terminal-Style Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              Personalized Intelligence Report
            </h2>
          </div>
          <p className="text-lg text-gray-400 font-mono">
            <span className="text-cyan-400">user:</span> {user.username} | <span className="text-purple-400">generated:</span> {new Date().toLocaleString()}
          </p>
        </motion.div>

        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Top Recommended Content */}
          {topContent.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-bg backdrop-blur-xl border border-cyan-500/30 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-cyan-500/20 pb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30">
                      <Sparkles className="w-5 h-5 text-cyan-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white font-mono">TOP RECOMMENDED CONTENT</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {topContent.map((rec, index) => {
                      const ContentIcon = getContentTypeIcon(rec.data);
                      const duration = formatDuration(rec.data);
                      const thumbnail = getThumbnail(rec.data);
                      
                      return (
                        <Link key={rec.id} href={`/summary/${rec.id}`}>
                          <div className="group cursor-pointer">
                            <div className="relative overflow-hidden rounded-lg mb-3 aspect-video">
                              <img 
                                src={thumbnail} 
                                alt={rec.data.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 glass-bg backdrop-blur-xl border border-white/20 rounded-full">
                                <ContentIcon className="w-3 h-3 text-cyan-300" />
                                {duration && <span className="text-xs text-white font-mono">{duration}</span>}
                              </div>
                              <div className="absolute bottom-2 right-2 px-2 py-1 bg-cyan-500/90 rounded-full">
                                <span className="text-xs font-bold text-white font-mono">{Math.round(rec.score)}%</span>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                              {rec.data.title}
                            </h4>
                            {rec.reasons[0] && (
                              <p className="text-xs text-gray-400 line-clamp-1 font-mono">
                                → {rec.reasons[0]}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Recommended Investors */}
              {topAvatars.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="glass-bg backdrop-blur-xl border border-purple-500/30 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6 border-b border-purple-500/20 pb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-400/30">
                          <Users className="w-5 h-5 text-purple-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white font-mono">RECOMMENDED INVESTORS</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {topAvatars.map((rec) => (
                          <Link key={rec.id} href={`/discover`}>
                            <div className="group cursor-pointer bg-slate-900/60 border border-purple-500/20 hover:border-purple-400/50 rounded-lg p-4 transition-all duration-300">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-400/40 flex items-center justify-center">
                                  <span className="text-sm font-bold text-purple-300 font-mono">
                                    {rec.data.name.split(' ').map((n: string) => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                                    {rec.data.name}
                                  </h4>
                                  <p className="text-xs text-purple-400/70 font-mono">@{rec.data.handle}</p>
                                </div>
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs font-mono">
                                  {Math.round(rec.score)}%
                                </Badge>
                              </div>
                              {rec.reasons[0] && (
                                <p className="text-xs text-gray-400 font-mono">→ {rec.reasons[0]}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Recommended Books */}
              {books && books.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="glass-bg backdrop-blur-xl border border-blue-500/30 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6 border-b border-blue-500/20 pb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                          <BookOpen className="w-5 h-5 text-blue-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white font-mono">RECOMMENDED READING</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {books.slice(0, 4).map((book, index) => (
                          <div 
                            key={index}
                            className="bg-slate-900/60 border border-blue-500/20 rounded-lg p-3"
                          >
                            <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">
                              {book.title}
                            </h4>
                            <p className="text-xs text-gray-400 mb-1 font-mono">by {book.author}</p>
                            <p className="text-xs text-blue-400/70 font-mono">
                              recommended by {book.avatarName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Aligned Assets */}
              {alignedAssets && alignedAssets.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="glass-bg backdrop-blur-xl border border-cyan-500/30 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6 border-b border-cyan-500/20 pb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30">
                          <BarChart3 className="w-5 h-5 text-cyan-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white font-mono">ALIGNED ASSETS</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {alignedAssets.map((asset, index) => (
                          <div 
                            key={index}
                            className="bg-slate-900/60 border border-cyan-500/20 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4 text-cyan-400" />
                              <h4 className="text-sm font-bold text-white font-mono">{asset.symbol}</h4>
                            </div>
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs mb-2 font-mono">
                              {asset.type.toUpperCase()}
                            </Badge>
                            <p className="text-xs text-gray-400 font-mono line-clamp-2">
                              {asset.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Recommended Podcasts */}
              {podcasts && podcasts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="glass-bg backdrop-blur-xl border border-purple-500/30 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6 border-b border-purple-500/20 pb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                          <Mic className="w-5 h-5 text-purple-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white font-mono">PODCAST EPISODES</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {podcasts.slice(0, 4).map((podcast, index) => (
                          <div 
                            key={index}
                            className="group bg-slate-900/60 border border-purple-500/20 hover:border-purple-400/50 rounded-lg p-3 transition-all duration-300 cursor-pointer"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <Play className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                              <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                                {podcast.title}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-400 mb-1 font-mono">guest: {podcast.guest}</p>
                            <p className="text-xs text-purple-400/70 font-mono">
                              from {podcast.avatarName}'s list
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>

          {/* Trending Topics Footer */}
          {trendingTopics && trendingTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-bg backdrop-blur-xl border border-white/10">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-gray-400 font-mono uppercase">Trending in your network:</span>
                    </div>
                    {trendingTopics.slice(0, 5).map((topic, index) => (
                      <Badge 
                        key={index}
                        className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 text-cyan-300 font-mono"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
