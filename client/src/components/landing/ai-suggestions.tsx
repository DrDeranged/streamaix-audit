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
  Play,
  DollarSign,
  ArrowRight,
  ChevronRight
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

  const getContentTypeLabel = (summary: any) => {
    const contentType = summary.contentType?.toLowerCase() || '';
    const platform = summary.platform?.toLowerCase() || '';
    
    if (contentType === 'podcast' || platform.includes('podcast') || platform.includes('spotify')) {
      return 'Podcast';
    } else if (contentType === 'video' || platform === 'youtube') {
      return 'Video';
    }
    return 'Article';
  };

  // Calculate real match score from recommendations
  const avgMatchScore = content.length > 0 
    ? Math.round(content.reduce((acc, rec) => acc + rec.score, 0) / content.length)
    : avatars.length > 0 
      ? Math.round(avatars.reduce((acc, rec) => acc + rec.score, 0) / avatars.length)
      : 0;

  return (
    <section id="suggestions" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* Unified Report Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20"
        >
          {/* Report Header */}
          <div className="border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/50">
                    <Brain className="w-7 h-7 text-cyan-300" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-orbitron font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                    Personalized Intelligence Report
                  </h2>
                </div>
                <p className="text-gray-400 text-sm ml-14">AI-curated insights tailored for {user.username}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-cyan-500/30">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="text-sm text-cyan-300 font-mono">{new Date().toLocaleDateString()}</span>
                </div>
                {avgMatchScore > 0 && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 px-3 py-1">
                    {avgMatchScore}% Match Score
                  </Badge>
                )}
              </div>
            </div>

            {/* Interest Tags */}
            {trendingTopics && trendingTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Focus Areas:</span>
                {trendingTopics.slice(0, 6).map((topic, i) => (
                  <Badge 
                    key={i}
                    className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/50 text-cyan-200 text-xs font-medium px-3 py-1"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Report Body */}
          <div className="p-8 space-y-8">
            {/* Executive Summary */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Executive Summary</h3>
              </div>
              <p className="text-gray-300 leading-relaxed bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                Based on your interests in <span className="text-purple-300 font-semibold">{trendingTopics?.slice(0, 3).join(', ') || 'technology and innovation'}</span>, 
                our AI has identified <span className="text-cyan-300 font-semibold">{content.length} high-value content pieces</span>
                {podcasts && podcasts.length > 0 && <>, <span className="text-blue-300 font-semibold">{podcasts.length} podcast episodes</span></>}
                {books && books.length > 0 && <>, <span className="text-green-300 font-semibold">{books.length} recommended books</span></>}
                {alignedAssets && alignedAssets.length > 0 && <>, and <span className="text-purple-300 font-semibold">{alignedAssets.length} aligned investment opportunities</span></>}
                . Additionally, we've identified <span className="text-cyan-300 font-semibold">{avatars.length} thought leaders</span> whose perspectives align with your learning goals.
              </p>
            </div>

            {/* Priority Content - Compact List */}
            {content.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold text-white">Priority Content</h3>
                  </div>
                  <span className="text-sm text-gray-500">{content.length} recommendations</span>
                </div>
                
                <div className="space-y-2">
                  {content.slice(0, 8).map((rec) => {
                    const ContentIcon = getContentTypeIcon(rec.data);
                    const contentType = getContentTypeLabel(rec.data);
                    
                    return (
                      <Link key={rec.id} href={`/summary/${rec.id}`}>
                        <div className="group cursor-pointer bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-800/60 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/50 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 flex-shrink-0">
                              <ContentIcon className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2 flex-1">
                                  {rec.data.title}
                                </h4>
                                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/50 text-xs font-bold font-mono px-2 py-1 flex-shrink-0">
                                  {Math.round(rec.score)}%
                                </Badge>
                              </div>
                              {rec.reasons[0] && (
                                <p className="text-xs text-gray-400 line-clamp-1 mb-2">{rec.reasons[0]}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge className="bg-slate-700/50 text-gray-300 border-slate-600/50 text-xs px-2 py-0.5">
                                  {contentType}
                                </Badge>
                                {rec.data.platform && (
                                  <span className="text-xs text-gray-500">via {rec.data.platform}</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Thought Leaders */}
            {avatars.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Recommended Thought Leaders</h3>
                  </div>
                  <span className="text-sm text-gray-500">{avatars.length} aligned experts</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {avatars.slice(0, 6).map((rec) => (
                    <Link key={rec.id} href="/discover">
                      <div className="group cursor-pointer bg-gradient-to-br from-slate-800/60 via-purple-900/20 to-slate-800/60 backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/50 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]">
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
              </div>
            )}

            {/* Two Column: Podcasts & Books */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Podcast Recommendations */}
              {podcasts && podcasts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-purple-400" />
                      <h3 className="text-xl font-bold text-white">Audio Learning</h3>
                    </div>
                    <span className="text-sm text-gray-500">{podcasts.length} episodes</span>
                  </div>
                  <div className="space-y-2">
                    {podcasts.slice(0, 5).map((podcast, i) => (
                      <div 
                        key={i}
                        className="group bg-gradient-to-br from-slate-800/60 via-purple-900/10 to-slate-800/60 backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/50 rounded-lg p-3 transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/40 flex-shrink-0 mt-0.5">
                            <Play className="w-3.5 h-3.5 text-purple-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors leading-snug mb-1">
                              {podcast.title}
                            </h4>
                            <p className="text-xs text-gray-400 truncate">
                              <span className="text-gray-500">with</span> {podcast.guest}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reading List */}
              {books && books.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">Reading List</h3>
                    </div>
                    <span className="text-sm text-gray-500">{books.length} books</span>
                  </div>
                  <div className="space-y-2">
                    {books.slice(0, 5).map((book, i) => (
                      <div 
                        key={i}
                        className="bg-gradient-to-br from-slate-800/60 via-blue-900/10 to-slate-800/60 backdrop-blur-xl border border-blue-500/20 hover:border-blue-400/50 rounded-lg p-3 transition-all duration-300"
                      >
                        <h4 className="text-sm font-bold text-white mb-1.5 line-clamp-2 leading-snug">
                          {book.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          <span className="text-gray-500">by</span> <span className="text-gray-300">{book.author}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Investment Alignment */}
            {alignedAssets && alignedAssets.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold text-white">Investment Alignment</h3>
                  </div>
                  <span className="text-sm text-gray-500">{alignedAssets.length} opportunities</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {alignedAssets.slice(0, 6).map((asset, i) => (
                    <div 
                      key={i}
                      className="bg-gradient-to-br from-slate-800/60 via-cyan-900/10 to-slate-800/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-400/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
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
              </div>
            )}

            {/* Report Footer */}
            <div className="pt-6 border-t border-cyan-500/20 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                This report is updated in real-time based on your activity and preferences
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-mono">Live</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
