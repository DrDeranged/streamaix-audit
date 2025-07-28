import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, Heart, Share2, Plus, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import navalAvatar from "@/assets/naval-avatar.svg";
import vitalikAvatar from "@/assets/vitalik-avatar.svg";

export function KnowledgeAvatars() {
  const profiles = [
    {
      name: "Naval Ravikant",
      handle: "@naval.eth",
      avatar: navalAvatar,
      gradient: "from-indigo-500 to-purple-600",
      stats: { summaries: 247, liked: "1.2k", saved: 89 },
      activities: [
        { icon: Bookmark, text: "Saved \"AI Safety in Practice\"", color: "text-indigo-400" },
        { icon: Heart, text: "Liked \"Web3 Infrastructure Deep Dive\"", color: "text-red-400" },
        { icon: Share2, text: "Shared on Farcaster", color: "text-green-400" }
      ]
    },
    {
      name: "Vitalik Buterin",
      handle: "@vitalik.lens",
      avatar: vitalikAvatar,
      gradient: "from-purple-500 to-cyan-500",
      stats: { summaries: 156, liked: "2.1k", saved: 203 },
      activities: [
        { icon: Plus, text: "Created \"ZK-Rollup Explainer\"", color: "text-purple-400" },
        { icon: Bookmark, text: "Saved \"DeFi Security Patterns\"", color: "text-indigo-400" },
        { icon: MessageCircle, text: "Commented on Lens", color: "text-blue-400" }
      ]
    }
  ];

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
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-card border-glass-border shadow-xl overflow-hidden">
                <div className="relative">
                  <div className={`h-24 bg-gradient-to-r ${profile.gradient}`} />
                  <div className="absolute -bottom-8 left-6">
                    <img 
                      src={profile.avatar} 
                      alt={`${profile.name} avatar`} 
                      className="w-16 h-16 rounded-full border-4 border-card object-cover"
                    />
                  </div>
                </div>
                
                <CardContent className="pt-12 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{profile.name}</h3>
                      <p className="text-muted-foreground">{profile.handle}</p>
                    </div>
                    <Button className={`bg-gradient-to-r ${profile.gradient} hover:opacity-90 text-white`}>
                      Follow Trail
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{profile.stats.summaries}</div>
                      <div className="text-sm text-muted-foreground">Summaries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{profile.stats.liked}</div>
                      <div className="text-sm text-muted-foreground">Liked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{profile.stats.saved}</div>
                      <div className="text-sm text-muted-foreground">Saved</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {profile.activities.map((activity, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <activity.icon className={`w-4 h-4 ${activity.color}`} />
                          <span>{activity.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
