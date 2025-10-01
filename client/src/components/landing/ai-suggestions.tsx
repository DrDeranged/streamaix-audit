import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, Users, Loader2 } from "lucide-react";
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

  // Show nothing if user not authenticated
  if (!isAuthenticated || !user) {
    return (
      <section id="suggestions" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Sign in to get personalized content recommendations based on your interests and followed avatars
            </p>
            <div className="mt-8">
              <Link href="/auth">
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                  Sign In to Get Started
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <section id="suggestions" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Intelligent content recommendations based on your interests and social graph
            </p>
          </motion.div>
          
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="ml-3 text-muted-foreground">Loading personalized recommendations...</span>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error || !data?.success) {
    return (
      <section id="suggestions" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Follow some knowledge avatars to get personalized recommendations
            </p>
            <div className="mt-8">
              <Link href="/discover">
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
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

  // If no content available
  if (!content || content.length === 0) {
    return (
      <section id="suggestions" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Suggestions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 mb-6">
              No recommendations yet. Process some content or follow knowledge avatars to get started!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/discover">
                <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                  Discover Avatars
                </button>
              </Link>
              <button 
                onClick={() => document.getElementById('ai-processor')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-6 py-3 border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-500/10 rounded-lg font-semibold transition-all duration-300"
              >
                Process Content
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Split content into three categories for display
  const suggestedContent = content.slice(0, 2);
  const agentPicks = content.slice(2, 4);
  const trendingContent = content.slice(4, 6);

  const getTagColor = (tags: string[] | undefined) => {
    if (!tags || tags.length === 0) return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    
    const tag = tags[0].toLowerCase();
    if (tag.includes('ai') || tag.includes('ml')) return "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300";
    if (tag.includes('blockchain') || tag.includes('crypto')) return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300";
    if (tag.includes('defi') || tag.includes('finance')) return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
    if (tag.includes('web3') || tag.includes('nft')) return "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300";
    if (tag.includes('quantum')) return "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300";
    return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
  };

  const formatDuration = (summary: any) => {
    if (summary.duration) {
      const minutes = Math.round(summary.duration / 60);
      return `${minutes}-min summary`;
    }
    return "Summary";
  };

  const suggestions = [
    {
      icon: Sparkles,
      title: "Suggested for You",
      color: "text-indigo-400",
      items: suggestedContent.map(rec => ({
        id: rec.id,
        image: rec.data.thumbnailUrl || "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
        title: rec.data.title,
        duration: formatDuration(rec.data),
        source: rec.data.platform || rec.data.sourceUrl || "StreamAiX",
        tag: rec.data.tags?.[0] || "Content",
        tagColor: getTagColor(rec.data.tags),
        match: `${Math.round(rec.score)}% match`,
        reason: rec.reasons[0]
      }))
    },
    {
      icon: Brain,
      title: "Your AI Agent Recommends",
      color: "text-purple-400",
      items: agentPicks.map(rec => ({
        id: rec.id,
        image: rec.data.thumbnailUrl || "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=200&fit=crop",
        title: rec.data.title,
        duration: formatDuration(rec.data),
        source: rec.data.platform || rec.data.sourceUrl || "StreamAiX",
        tag: rec.data.tags?.[0] || "AI Pick",
        tagColor: getTagColor(rec.data.tags),
        match: "Agent pick",
        reason: rec.reasons[0]
      }))
    },
    {
      icon: Users,
      title: trendingTopics.length > 0 ? `Trending: ${trendingTopics[0]}` : "Trending Content",
      color: "text-cyan-400",
      items: trendingContent.map(rec => ({
        id: rec.id,
        image: rec.data.thumbnailUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=200&fit=crop",
        title: rec.data.title,
        duration: formatDuration(rec.data),
        source: rec.data.platform || rec.data.sourceUrl || "StreamAiX",
        tag: rec.data.tags?.[0] || "Trending",
        tagColor: getTagColor(rec.data.tags),
        match: "Trending",
        reason: rec.reasons[0]
      }))
    }
  ];

  return (
    <section id="suggestions" className="py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            AI-Powered Suggestions
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Intelligent content recommendations based on your interests and followed avatars
          </p>
          {trendingTopics.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 px-4">
              <span className="text-sm text-muted-foreground">Trending:</span>
              {trendingTopics.slice(0, 5).map(topic => (
                <span key={topic} className="text-sm px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {suggestions.map((section, sectionIndex) => (
            section.items.length > 0 && (
              <motion.div 
                key={section.title}
                className="space-y-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: sectionIndex * 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-foreground flex items-center">
                  <section.icon className={`w-5 h-5 mr-2 ${section.color}`} />
                  {section.title}
                </h3>
                
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link href={`/summary/${item.id}`}>
                        <Card 
                          className="bg-card border-glass-border hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 cursor-pointer"
                          data-testid={`card-suggestion-${item.id}`}
                        >
                          <CardContent className="p-4">
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              className="w-full h-24 object-cover rounded-lg mb-3"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop";
                              }}
                            />
                            <h4 className="font-semibold text-foreground mb-2 line-clamp-2">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {item.duration} • {item.source}
                            </p>
                            {item.reason && (
                              <p className="text-xs text-muted-foreground mb-2 italic line-clamp-1">
                                {item.reason}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className={`text-xs px-2 py-1 rounded ${item.tagColor}`}>
                                {item.tag}
                              </span>
                              <span className={`text-xs ${
                                section.title.includes("Agent") ? "text-purple-500" : 
                                section.title.includes("Trending") ? "text-cyan-500" : 
                                "text-indigo-500"
                              } font-medium`}>
                                {item.match}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          ))}
        </div>
      </div>
    </section>
  );
}
