import { Badge } from "@/components/ui/badge";
import SectionTitle from "@/components/ds/SectionTitle";
import Surface from "@/components/ds/Surface";
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
  ArrowUpRight,
  FileText,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery<{ success: boolean } & MixedRecommendations>({
    queryKey: ['/api/recommendations/mixed'],
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (!isAuthenticated || !user) {
    return (
      <section id="suggestions" className="pt-20 pb-24 relative overflow-hidden bg-transparent">
        
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <SectionTitle as="h2" className="text-center">AI-Powered Recommendations</SectionTitle>
            <p className="mt-2 text-sm text-secondary">Sign in to get personalized content</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-accent-core/10 rounded-xl blur-2xl" />
              
              <Surface className="relative p-12">
                <div className="flex justify-center mb-8">
                  <div className="p-5 rounded-xl bg-accent-core/10 border border-accent-core/30">
                    <Brain className="w-14 h-14 text-accent-bright" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-center mb-4 text-primary">
                  Unlock Personalized Recommendations
                </h3>
                
                <p className="text-base text-secondary text-center mb-10 max-w-xl mx-auto">
                  Sign in to get AI-powered content recommendations tailored to your interests and followed avatars
                </p>

                <div className="flex justify-center">
                  <Link href="/auth">
                    <motion.button 
                      className="px-8 py-3.5 grad-accent hover:bg-accent-deep text-primary rounded-xl font-semibold transition-all duration-300 glow-accent"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      data-testid="button-signin"
                    >
                      Sign In to Continue
                    </motion.button>
                  </Link>
                </div>
              </Surface>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="suggestions" className="pt-20 pb-24 relative bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
             <SectionTitle as="h2" className="text-center">AI-Powered Recommendations</SectionTitle>
             <p className="mt-2 text-sm text-secondary">Loading your recommendations...</p>
          </motion.div>
          
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent-bright" />
            <span className="ml-4 text-secondary text-lg">Analyzing your preferences...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data?.success) {
    return (
      <section id="suggestions" className="pt-20 pb-24 relative bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <SectionTitle as="h2" className="text-center">AI-Powered Recommendations</SectionTitle>
            <p className="mt-2 text-sm text-secondary">Follow some knowledge avatars to get personalized recommendations</p>
            <Link href="/discover">
              <button 
                className="px-8 py-3.5 grad-accent hover:bg-accent-deep text-primary rounded-xl font-semibold transition-all duration-300 glow-accent"
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
    <section id="suggestions" className="pt-20 pb-20 relative overflow-hidden bg-transparent">
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* Compact Report Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="cursor-pointer group"
              data-testid="button-open-intelligence-report"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-accent-core/10 rounded-xl blur-2xl group-hover:blur-3xl transition-all duration-300" />
                
                <Surface className="relative overflow-hidden transition-all duration-300 group-hover:scale-[1.01]">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-accent-core/15 border border-accent-core/40 group-hover:scale-110 transition-transform duration-300">
                          <Brain className="w-8 h-8 text-accent-bright" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-display font-bold text-primary">
                            Personalized Intelligence Report
                          </h2>
                          <p className="text-secondary text-sm mt-1">Click to view your curated insights</p>
                        </div>
                      </div>
                      {avgMatchScore > 0 && (
                        <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/40 px-4 py-2 text-lg">
                          {avgMatchScore}% Match
                        </Badge>
                      )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-accent-core/10 border border-accent-core/30 rounded-xl p-4 text-center">
                        <div className="flex justify-center mb-2">
                          <Video className="w-5 h-5 text-accent-bright" />
                        </div>
                        <div className="tabular text-2xl font-bold text-accent-bright">{topVideos.length}</div>
                        <div className="text-xs text-muted mt-1">Videos</div>
                      </div>
                      <div className="bg-accent-core/10 border border-accent-core/30 rounded-xl p-4 text-center">
                        <div className="flex justify-center mb-2">
                          <Users className="w-5 h-5 text-accent-bright" />
                        </div>
                        <div className="tabular text-2xl font-bold text-accent-bright">{topLeaders.length}</div>
                        <div className="text-xs text-muted mt-1">Leaders</div>
                      </div>
                      <div className="bg-accent-core/10 border border-accent-core/30 rounded-xl p-4 text-center">
                        <div className="flex justify-center mb-2">
                          <BookOpen className="w-5 h-5 text-accent-bright" />
                        </div>
                        <div className="tabular text-2xl font-bold text-accent-bright">{topBooks.length}</div>
                        <div className="text-xs text-muted mt-1">Books</div>
                      </div>
                      <div className="bg-gain/10 border border-gain/30 rounded-xl p-4 text-center">
                        <div className="flex justify-center mb-2">
                          <TrendingUp className="w-5 h-5 text-gain" />
                        </div>
                        <div className="tabular text-2xl font-bold text-gain">{topInvestments.length}</div>
                        <div className="text-xs text-muted mt-1">Opportunities</div>
                      </div>
                    </div>

                    {/* Call to Action */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-accent-bright group-hover:text-primary transition-colors">
                      <FileText className="w-5 h-5" />
                      <span className="font-semibold">Click to view full report</span>
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </Surface>
              </div>
            </motion.div>
          </DialogTrigger>

          {/* Full Report Modal */}
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-ink-surface border border-ink-edge rounded-2xl">
            <DialogHeader className="border-b border-ink-divider pb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-accent-core/15 border border-accent-core/40">
                      <Brain className="w-7 h-7 text-accent-bright" />
                    </div>
                    <DialogTitle className="text-2xl font-display font-bold text-primary">
                      Personalized Intelligence Report
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-secondary ml-14">
                    AI-curated insights tailored for {user.username}
                  </DialogDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-raised border border-ink-edge">
                    <div className="w-2 h-2 bg-accent-core rounded-full animate-pulse" />
                    <span className="text-sm text-accent-bright font-mono">{new Date().toLocaleDateString()}</span>
                  </div>
                  {avgMatchScore > 0 && (
                    <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/40 px-3 py-1">
                      {avgMatchScore}% Match Score
                    </Badge>
                  )}
                </div>
              </div>

              {/* Interest Tags */}
              {trendingTopics && trendingTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted uppercase tracking-wider font-mono">Focus Areas:</span>
                  {trendingTopics.slice(0, 6).map((topic, i) => (
                    <Badge 
                      key={i}
                      className="bg-accent-core/15 border-accent-core/40 text-accent-bright text-xs font-medium px-3 py-1"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </DialogHeader>

            {/* Report Body */}
            <div className="pt-6 space-y-8">
              {/* Executive Summary */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent-bright" />
                  <SectionTitle as="h3">Executive Summary</SectionTitle>
                </div>
                <p className="text-body leading-relaxed bg-ink-raised border border-ink-edge rounded-xl p-4">
                  Based on your interests in <span className="text-accent-bright font-semibold">{trendingTopics?.slice(0, 3).join(', ') || 'technology and innovation'}</span>, 
                  we've curated <span className="text-accent-bright font-semibold">5 must-watch videos</span>, 
                  <span className="text-accent-bright font-semibold"> 3 key thought leaders</span> to follow, 
                  <span className="text-accent-bright font-semibold"> 3 essential books</span>, and 
                  <span className="text-gain font-semibold"> {topInvestments.length} market opportunities</span> aligned with current market conditions.
                </p>
              </div>

              {/* Top 5 Videos */}
              {topVideos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-accent-bright" />
                      <h3 className="text-xl font-bold text-primary">Top 5 Must-Watch Videos</h3>
                    </div>
                    <span className="text-sm text-muted">Highest priority content</span>
                  </div>
                  
                  <div className="space-y-3">
                    {topVideos.map((rec, index) => (
                      <Link key={rec.id} href={`/summary/${rec.id}`}>
                        <div 
                          className="group cursor-pointer bg-ink-raised border border-accent-core/20 hover:border-accent-core/40 rounded-xl p-5 transition-all duration-300 hover:scale-[1.01]"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-accent-core/15 border border-accent-core/40 flex items-center justify-center">
                                <span className="text-xl font-bold text-accent-bright">#{index + 1}</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h4 className="text-base font-bold text-primary group-hover:text-accent-bright transition-colors leading-snug line-clamp-2">
                                  {rec.data.title}
                                </h4>
                                <Badge className="bg-cyan-500/20 text-accent-bright border-accent-core/40 text-sm font-bold font-mono px-3 py-1 flex-shrink-0">
                                  {Math.round(rec.score)}%
                                </Badge>
                              </div>
                              {rec.reasons[0] && (
                                <p className="text-sm text-secondary mb-3 line-clamp-2 leading-relaxed">{rec.reasons[0]}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge className="bg-ink-surface text-body border-ink-edge text-xs px-2.5 py-1">
                                  <Video className="w-3 h-3 mr-1 inline" />
                                  Video
                                </Badge>
                                {rec.data.platform && (
                                  <span className="text-xs text-muted">via {rec.data.platform}</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-accent-bright opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
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
                      <Users className="w-5 h-5 text-accent-bright" />
                      <h3 className="text-xl font-bold text-primary">3 Key Thought Leaders</h3>
                    </div>
                    <span className="text-sm text-muted">Most aligned experts</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topLeaders.map((rec, index) => (
                      <Link key={rec.id} href={`/avatar/${rec.data.handle}`}>
                        <div 
                          className="group cursor-pointer bg-ink-raised border border-accent-core/20 hover:border-accent-core/40 rounded-xl p-5 transition-all duration-300 hover:scale-[1.02]"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          <div className="text-center">
                            <div className="relative inline-block mb-4">
                              <div className="w-20 h-20 rounded-full bg-accent-core/15 border-3 border-accent-core/40 flex items-center justify-center mx-auto">
                                <span className="text-2xl font-bold text-accent-bright">
                                  {rec.data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-accent-core border-2 border-ink-page flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">#{index + 1}</span>
                              </div>
                            </div>
                            <h4 className="text-base font-bold text-primary group-hover:text-accent-bright transition-colors mb-1">
                              {rec.data.name}
                            </h4>
                            <p className="text-xs text-muted mb-3">@{rec.data.handle}</p>
                            <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/40 text-sm font-bold font-mono px-3 py-1.5">
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
                      <BookOpen className="w-5 h-5 text-accent-bright" />
                      <h3 className="text-xl font-bold text-primary">3 Essential Books</h3>
                    </div>
                    <span className="text-sm text-muted">Recommended reading</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topBooks.map((book, i) => (
                      <div 
                        key={i}
                        className="bg-ink-raised backdrop-blur-xl border border-accent-core/20 hover:border-accent-core/40 rounded-xl p-5 transition-all duration-300"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 rounded-xl bg-accent-core/10 border border-accent-core/40">
                            <BookOpen className="w-5 h-5 text-accent-bright" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-primary mb-2 line-clamp-2 leading-snug">
                              {book.title}
                            </h4>
                            <p className="text-xs text-secondary mb-1">
                              <span className="text-muted">by</span> <span className="text-body">{book.author}</span>
                            </p>
                            <p className="text-xs text-muted">
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
                      <TrendingUp className="w-5 h-5 text-gain" />
                      <h3 className="text-xl font-bold text-primary">Market Opportunities</h3>
                    </div>
                    <span className="text-sm text-muted">{topInvestments.length} aligned positions</span>
                  </div>
                  <p className="text-sm text-secondary mb-4 leading-relaxed">
                    Based on current market conditions and your focus areas, these assets align with your interests:
                  </p>
                  <div className="space-y-3">
                    {topInvestments.map((asset, i) => (
                      <div 
                        key={i}
                        className="group bg-ink-raised backdrop-blur-xl border border-gain/20 hover:border-gain/40 rounded-xl p-5 transition-all duration-300"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-gain/10 border border-gain/40 flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-gain" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <h4 className="text-lg font-bold text-primary font-mono mb-1">{asset.symbol}</h4>
                                <p className="text-sm text-secondary">{asset.name}</p>
                              </div>
                              <Badge className="bg-green-500/20 text-gain border-gain/40 text-xs font-bold px-3 py-1.5 flex-shrink-0">
                                {asset.type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-start gap-2 mt-3 p-3 bg-ink-surface border border-gain/20 rounded-xl">
                              <ArrowUpRight className="w-4 h-4 text-gain flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-body leading-relaxed">
                                <span className="text-gain font-semibold">Why now:</span> {asset.reason}
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
              <div className="pt-6 border-t border-accent-core/20 flex items-center justify-between">
                <p className="text-xs text-muted">
                  This report is updated in real-time based on your activity and market conditions
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-gain font-mono">Live</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
