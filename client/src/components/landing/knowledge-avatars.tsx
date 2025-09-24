import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, Heart, Share2, Plus, MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface KnowledgeAvatar {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  pfpUrl: string;
  followerCount: number;
  role: string;
  expertise: string[];
  keyTakeaways: string[];
  stats: {
    summaries: number;
    liked: string;
    saved: number;
  };
  resources: Array<{
    id: string;
    title: string;
    url: string;
    description: string;
    resourceType: string;
    difficulty: string;
    priority: number;
    topics: string[];
  }>;
  recentActivity: Array<{
    icon: string;
    text: string;
    color: string;
  }>;
}

const iconMap = {
  bookmark: Bookmark,
  heart: Heart,
  share2: Share2,
  plus: Plus,
  'message-circle': MessageCircle,
  user: User
};

export function KnowledgeAvatars() {
  const { data: avatarsData, isLoading, error } = useQuery({
    queryKey: ['/api/knowledge-avatars'],
    queryFn: async () => {
      const response = await fetch('/api/knowledge-avatars');
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge avatars');
      }
      const result = await response.json();
      return result.avatars as KnowledgeAvatar[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Get gradient for each avatar based on their role
  const getGradient = (role: string) => {
    if (role.includes('Angel') || role.includes('Philosopher')) {
      return "from-indigo-500 to-purple-600";
    } else if (role.includes('Ethereum') || role.includes('Founder')) {
      return "from-purple-500 to-cyan-500";
    }
    return "from-blue-500 to-indigo-600";
  };

  const profiles = avatarsData || [];

  return (
    <section id="profiles" className="py-20 bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Knowledge Avatars
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Follow thought leaders and discover content through their knowledge trails
          </p>
        </motion.div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Knowledge Avatars...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">Failed to load Knowledge Avatars</p>
            <p className="text-muted-foreground text-sm">Please try refreshing the page</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-card border-glass-border shadow-xl overflow-hidden">
                  <div className="relative">
                    <div className={`h-24 bg-gradient-to-r ${getGradient(profile.role)}`} />
                    <div className="absolute -bottom-8 left-6">
                      <img 
                        src={profile.pfpUrl} 
                        alt={`${profile.displayName} avatar`} 
                        className="w-16 h-16 rounded-full border-4 border-card object-cover"
                        data-testid={`img-avatar-${profile.username}`}
                      />
                    </div>
                  </div>
                  
                  <CardContent className="pt-12 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold" data-testid={`text-name-${profile.username}`}>
                        {profile.displayName}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2" data-testid={`text-role-${profile.username}`}>
                      {profile.role}
                    </p>
                    <p className="text-muted-foreground text-xs mb-4 line-clamp-2" data-testid={`text-bio-${profile.username}`}>
                      {profile.bio}
                    </p>
                    
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-500" data-testid={`stat-summaries-${profile.username}`}>
                          {profile.stats.summaries}
                        </div>
                        <div className="text-xs text-muted-foreground">Resources</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-400" data-testid={`stat-liked-${profile.username}`}>
                          {profile.stats.liked}
                        </div>
                        <div className="text-xs text-muted-foreground">Liked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400" data-testid={`stat-saved-${profile.username}`}>
                          {profile.stats.saved}
                        </div>
                        <div className="text-xs text-muted-foreground">Saved</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <h4 className="text-sm font-semibold">Recent Activity</h4>
                      {(profile.recentActivity || []).map((activity, actIndex) => {
                        const IconComponent = iconMap[activity.icon as keyof typeof iconMap] || User;
                        return (
                          <div key={actIndex} className="flex items-center gap-2 text-sm">
                            <IconComponent className={`w-4 h-4 ${activity.color}`} />
                            <span className="text-muted-foreground">{activity.text}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2">Expertise</h4>
                      <div className="flex flex-wrap gap-1">
                        {(profile.expertise || []).slice(0, 3).map((skill, skillIndex) => (
                          <span 
                            key={skillIndex} 
                            className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full"
                            data-testid={`tag-expertise-${profile.username}-${skillIndex}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
                      data-testid={`button-follow-${profile.username}`}
                    >
                      Follow Knowledge Trail
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}