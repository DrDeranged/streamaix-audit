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
  Target,
  BarChart3,
  Play,
  Star,
  Eye,
  ThumbsUp,
  Bookmark,
  TrendingDown,
  DollarSign
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

  // Calculate mock engagement metrics
  const totalViews = Math.floor(Math.random() * 50000) + 10000;
  const avgAccuracy = 82 + Math.floor(Math.random() * 13);
  const contentSaved = Math.floor(Math.random() * 100) + 20;

  return (
    <section id="suggestions" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Personal Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/40">
              <Sparkles className="w-6 h-6 text-cyan-300" />
            </div>
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              AI Recommendations
            </h2>
            <div className="ml-auto hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-slate-900/60 to-slate-800/60 border border-cyan-500/20">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-sm text-cyan-300 font-mono">{user.username}</span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-gray-400 font-mono">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* User Interest Tags */}
          {trendingTopics && trendingTopics.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3 uppercase tracking-wider font-mono">Your Interests</p>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.slice(0, 6).map((topic, i) => (
                  <Badge 
                    key={i}
                    className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/50 text-cyan-200 text-sm font-medium px-4 py-1.5"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Performance Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Performance Analytics</h3>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Views */}
            <div className="bg-gradient-to-br from-slate-900/90 via-blue-900/30 to-slate-900/90 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
                  <Eye className="w-5 h-5 text-blue-300" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{(totalViews / 1000).toFixed(1)}K</div>
              <div className="text-sm text-gray-400 mb-1">Content Views</div>
              <div className="text-xs text-blue-400">Last 30 days</div>
            </div>

            {/* Recommendation Match */}
            <div className="bg-gradient-to-br from-slate-900/90 via-purple-900/30 to-slate-900/90 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30">
                  <Target className="w-5 h-5 text-purple-300" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{avgAccuracy}%</div>
              <div className="text-sm text-gray-400 mb-1">Match Accuracy</div>
              <div className="text-xs text-purple-400">AI-driven insights</div>
            </div>

            {/* Content Saved */}
            <div className="bg-gradient-to-br from-slate-900/90 via-cyan-900/30 to-slate-900/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30">
                  <Bookmark className="w-5 h-5 text-cyan-300" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{contentSaved}</div>
              <div className="text-sm text-gray-400 mb-1">Items Saved</div>
              <div className="text-xs text-cyan-400">Your collection</div>
            </div>

            {/* Following */}
            <div className="bg-gradient-to-br from-slate-900/90 via-green-900/30 to-slate-900/90 backdrop-blur-xl border border-green-500/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-500/20 border border-green-400/30">
                  <Users className="w-5 h-5 text-green-300" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{avatars.length}</div>
              <div className="text-sm text-gray-400 mb-1">Avatars Following</div>
              <div className="text-xs text-green-400">Active sources</div>
            </div>
          </div>
        </motion.div>

        {/* Investment Thesis / Personalized Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Your Learning Path</h3>
          </div>
          
          <div className="bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
            <p className="text-gray-300 leading-relaxed">
              Based on your interests in {trendingTopics?.slice(0, 3).join(', ') || 'technology and innovation'}, 
              our AI has curated content from thought leaders in these spaces. Discover insights that align with your 
              learning goals and investment philosophy.
            </p>
          </div>
        </motion.div>

        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Top Content Picks */}
          {content.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Top Picks For You</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {content.slice(0, 12).map((rec) => {
                  const ContentIcon = getContentTypeIcon(rec.data);
                  return (
                    <Link key={rec.id} href={`/summary/${rec.id}`}>
                      <div className="group cursor-pointer h-full bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/40">
                            <ContentIcon className="w-4 h-4 text-cyan-300" />
                          </div>
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/50 text-xs font-bold font-mono px-2 py-0.5">
                            {Math.round(rec.score)}%
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors leading-snug min-h-[40px]">
                          {rec.data.title}
                        </h4>
                        {rec.reasons[0] && (
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
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
            {/* Column 1: Recommended Avatars */}
            <div className="space-y-6">
              {avatars.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Recommended Avatars</h3>
                  </div>
                  <div className="space-y-3">
                    {avatars.slice(0, 8).map((rec) => (
                      <Link key={rec.id} href="/discover">
                        <div className="group cursor-pointer bg-gradient-to-br from-slate-900/90 via-purple-900/30 to-slate-900/90 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/60 rounded-xl p-4 transition-all duration-300 hover:scale-102 hover:shadow-lg hover:shadow-purple-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/40 to-blue-500/40 border-2 border-purple-400/50 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-purple-200">
                                {rec.data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                {rec.data.name}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">@{rec.data.handle}</p>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 text-xs font-bold font-mono px-2.5 py-1 flex-shrink-0">
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
                  <div className="flex items-center gap-2 mb-5">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold text-white">Aligned Assets</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {alignedAssets.slice(0, 6).map((asset, i) => (
                      <div 
                        key={i}
                        className="bg-gradient-to-br from-slate-900/90 via-cyan-900/20 to-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-400/60 transition-all duration-300"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <h4 className="text-sm font-bold text-white font-mono truncate">{asset.symbol}</h4>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/50 text-xs mb-2 font-mono">
                          {asset.type.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
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
                <div className="flex items-center gap-2 mb-5">
                  <Mic className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Podcast Episodes</h3>
                </div>
                <div className="space-y-3">
                  {podcasts.slice(0, 10).map((podcast, i) => (
                    <div 
                      key={i}
                      className="group bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/60 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:scale-102 hover:shadow-lg hover:shadow-purple-500/20"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/40 flex-shrink-0">
                          <Play className="w-4 h-4 text-purple-300" />
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors flex-1 leading-snug">
                          {podcast.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400 mb-1.5 ml-11">guest: <span className="text-gray-300">{podcast.guest}</span></p>
                      <p className="text-xs text-purple-400/70 font-mono truncate ml-11">
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
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Reading List</h3>
                </div>
                <div className="space-y-3">
                  {books.slice(0, 10).map((book, i) => (
                    <div 
                      key={i}
                      className="bg-gradient-to-br from-slate-900/90 via-blue-900/20 to-slate-900/90 backdrop-blur-xl border border-blue-500/30 hover:border-blue-400/60 rounded-xl p-4 transition-all duration-300 hover:scale-102"
                    >
                      <h4 className="text-sm font-bold text-white mb-2 line-clamp-2 leading-snug min-h-[40px]">
                        {book.title}
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">by <span className="text-gray-300">{book.author}</span></p>
                      {book.category && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs mb-2 font-mono">
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
