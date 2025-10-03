import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Loader2, 
  Video, 
  BookOpen,
  Users,
  Target,
  DollarSign,
  ChevronRight,
  TrendingDown,
  ArrowUpRight
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
  podcasts: any[];
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

  const { content, avatars, books, alignedAssets, trendingTopics } = data;

  // Calculate real match score from recommendations
  const avgMatchScore = content.length > 0 
    ? Math.round(content.reduce((acc, rec) => acc + rec.score, 0) / content.length)
    : avatars.length > 0 
      ? Math.round(avatars.reduce((acc, rec) => acc + rec.score, 0) / avatars.length)
      : 0;

  // Get top 5 videos only
  const topVideos = content.slice(0, 5);
  
  // Get top 3 leaders
  const topLeaders = avatars.slice(0, 3);
  
  // Get top 3 books
  const topBooks = books?.slice(0, 3) || [];
  
  // Get 3-5 investment opportunities
  const topInvestments = alignedAssets?.slice(0, 5) || [];

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
                we've curated <span className="text-cyan-300 font-semibold">5 must-watch videos</span>, 
                <span className="text-purple-300 font-semibold"> 3 key thought leaders</span> to follow, 
                <span className="text-blue-300 font-semibold"> 3 essential books</span>, and 
                <span className="text-green-300 font-semibold"> {topInvestments.length} market opportunities</span> aligned with current market conditions.
              </p>
            </div>

            {/* Top 5 Videos */}
            {topVideos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold text-white">Top 5 Must-Watch Videos</h3>
                  </div>
                  <span className="text-sm text-gray-500">Highest priority content</span>
                </div>
                
                <div className="space-y-3">
                  {topVideos.map((rec, index) => (
                    <Link key={rec.id} href={`/summary/${rec.id}`}>
                      <div className="group cursor-pointer bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-800/60 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/50 rounded-xl p-5 transition-all duration-300 hover:scale-[1.01]">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 flex items-center justify-center">
                              <span className="text-xl font-bold text-cyan-300">#{index + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                                {rec.data.title}
                              </h4>
                              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/50 text-sm font-bold font-mono px-3 py-1 flex-shrink-0">
                                {Math.round(rec.score)}%
                              </Badge>
                            </div>
                            {rec.reasons[0] && (
                              <p className="text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">{rec.reasons[0]}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-700/50 text-gray-300 border-slate-600/50 text-xs px-2.5 py-1">
                                <Video className="w-3 h-3 mr-1 inline" />
                                Video
                              </Badge>
                              {rec.data.platform && (
                                <span className="text-xs text-gray-500">via {rec.data.platform}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3 Key Leaders */}
            {topLeaders.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">3 Key Thought Leaders</h3>
                  </div>
                  <span className="text-sm text-gray-500">Most aligned experts</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topLeaders.map((rec, index) => (
                    <Link key={rec.id} href={`/avatar/${rec.data.handle}`}>
                      <div className="group cursor-pointer bg-gradient-to-br from-slate-800/60 via-purple-900/20 to-slate-800/60 backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/50 rounded-xl p-5 transition-all duration-300 hover:scale-[1.02]">
                        <div className="text-center">
                          <div className="relative inline-block mb-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/40 to-blue-500/40 border-3 border-purple-400/50 flex items-center justify-center mx-auto">
                              <span className="text-2xl font-bold text-purple-200">
                                {rec.data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 border-2 border-slate-900 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">#{index + 1}</span>
                            </div>
                          </div>
                          <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors mb-1">
                            {rec.data.name}
                          </h4>
                          <p className="text-xs text-gray-500 mb-3">@{rec.data.handle}</p>
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 text-sm font-bold font-mono px-3 py-1.5">
                            {Math.round(rec.score)}% Match
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3 Essential Books */}
            {topBooks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">3 Essential Books</h3>
                  </div>
                  <span className="text-sm text-gray-500">Recommended reading</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topBooks.map((book, i) => (
                    <div 
                      key={i}
                      className="bg-gradient-to-br from-slate-800/60 via-blue-900/10 to-slate-800/60 backdrop-blur-xl border border-blue-500/20 hover:border-blue-400/50 rounded-xl p-5 transition-all duration-300"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/40">
                          <BookOpen className="w-5 h-5 text-blue-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white mb-2 line-clamp-2 leading-snug">
                            {book.title}
                          </h4>
                          <p className="text-xs text-gray-400 mb-1">
                            <span className="text-gray-500">by</span> <span className="text-gray-300">{book.author}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Recommended by {book.avatarName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Opportunities - 3-5 suggestions */}
            {topInvestments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Market Opportunities</h3>
                  </div>
                  <span className="text-sm text-gray-500">{topInvestments.length} aligned positions</span>
                </div>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Based on current market conditions and your focus areas, these assets align with your interests:
                </p>
                <div className="space-y-3">
                  {topInvestments.map((asset, i) => (
                    <div 
                      key={i}
                      className="group bg-gradient-to-br from-slate-800/60 via-green-900/10 to-slate-800/60 backdrop-blur-xl border border-green-500/20 hover:border-green-400/50 rounded-xl p-5 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/30 to-cyan-500/30 border border-green-400/50 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-300" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h4 className="text-lg font-bold text-white font-mono mb-1">{asset.symbol}</h4>
                              <p className="text-sm text-gray-400">{asset.name}</p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-300 border-green-400/50 text-xs font-bold px-3 py-1.5 flex-shrink-0">
                              {asset.type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-start gap-2 mt-3 p-3 bg-slate-900/60 border border-green-500/20 rounded-lg">
                            <ArrowUpRight className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300 leading-relaxed">
                              <span className="text-green-400 font-semibold">Why now:</span> {asset.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Footer */}
            <div className="pt-6 border-t border-cyan-500/20 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                This report is updated in real-time based on your activity and market conditions
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
