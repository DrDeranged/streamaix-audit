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
  BookOpen,
  Users,
  DollarSign,
  BarChart3,
  Star,
  Play,
  TrendingDown,
  ChevronRight,
  Zap,
  Target,
  Award
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
              AI-Powered Recommendations
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
              AI-Powered Recommendations
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
              AI-Powered Recommendations
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

  return (
    <section id="suggestions" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Compact Header */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl md:text-4xl font-orbitron font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                AI Recommendations
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 font-mono">
              <span className="text-cyan-400">{user.username}</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          {trendingTopics && trendingTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-500 uppercase font-mono">Trending:</span>
              {trendingTopics.slice(0, 5).map((topic, i) => (
                <Badge 
                  key={i}
                  className="bg-cyan-500/10 border-cyan-500/30 text-cyan-300 text-xs font-mono px-2 py-0.5"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>

        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Top Content Grid - 6 items in 2 rows */}
          {content.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Top Picks For You</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {content.slice(0, 12).map((rec) => {
                  const ContentIcon = getContentTypeIcon(rec.data);
                  return (
                    <Link key={rec.id} href={`/summary/${rec.id}`}>
                      <div className="group cursor-pointer glass-bg backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/50 rounded-lg p-3 transition-all duration-300 h-full">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="p-1.5 rounded bg-cyan-500/20 border border-cyan-400/30 flex-shrink-0">
                            <ContentIcon className="w-3 h-3 text-cyan-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs font-mono px-1.5 py-0 mb-1">
                              {Math.round(rec.score)}%
                            </Badge>
                          </div>
                        </div>
                        <h4 className="text-xs font-semibold text-white mb-1.5 line-clamp-2 group-hover:text-cyan-300 transition-colors leading-tight">
                          {rec.data.title}
                        </h4>
                        {rec.reasons[0] && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {rec.reasons[0]}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Investors + Assets */}
            <div className="space-y-6">
              {/* Recommended Investors */}
              {avatars.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Top Investors</h3>
                  </div>
                  <div className="space-y-2">
                    {avatars.slice(0, 8).map((rec) => (
                      <Link key={rec.id} href="/discover">
                        <div className="group cursor-pointer glass-bg backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/50 rounded-lg p-3 transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-400/40 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-purple-300">
                                {rec.data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                {rec.data.name}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">@{rec.data.handle}</p>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs font-mono px-1.5 py-0 flex-shrink-0">
                              {Math.round(rec.score)}%
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Aligned Assets */}
              {alignedAssets && alignedAssets.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Aligned Assets</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {alignedAssets.map((asset, i) => (
                      <div 
                        key={i}
                        className="glass-bg backdrop-blur-xl border border-cyan-500/20 rounded-lg p-2.5"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <DollarSign className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <h4 className="text-xs font-bold text-white font-mono truncate">{asset.symbol}</h4>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs mb-1.5 font-mono">
                          {asset.type.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {asset.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Column 2: Podcasts */}
            {podcasts && podcasts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Mic className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Podcast Episodes</h3>
                </div>
                <div className="space-y-2">
                  {podcasts.slice(0, 10).map((podcast, i) => (
                    <div 
                      key={i}
                      className="group glass-bg backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/50 rounded-lg p-3 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start gap-2 mb-1.5">
                        <Play className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                        <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors flex-1">
                          {podcast.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">guest: {podcast.guest}</p>
                      <p className="text-xs text-purple-400/70 font-mono truncate">
                        via {podcast.avatarName}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Column 3: Books */}
            {books && books.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Reading List</h3>
                </div>
                <div className="space-y-2">
                  {books.slice(0, 10).map((book, i) => (
                    <div 
                      key={i}
                      className="glass-bg backdrop-blur-xl border border-blue-500/20 rounded-lg p-3"
                    >
                      <h4 className="text-xs font-bold text-white mb-1 line-clamp-2 leading-tight">
                        {book.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-1">by {book.author}</p>
                      {book.category && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs mb-1.5 font-mono">
                          {book.category}
                        </Badge>
                      )}
                      <p className="text-xs text-blue-400/70 font-mono truncate">
                        via {book.avatarName}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
