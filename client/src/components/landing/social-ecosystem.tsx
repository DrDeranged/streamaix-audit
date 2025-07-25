import { MessageCircle, Users, Image, Edit3, Zap, Share2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function SocialEcosystem() {
  const platforms = [
    { name: "Farcaster", icon: MessageCircle, color: "from-purple-500 to-pink-600" },
    { name: "Lens Protocol", icon: Users, color: "from-green-500 to-teal-600" },
    { name: "Zora", icon: Image, color: "from-blue-500 to-indigo-600" },
    { name: "Mirror", icon: Edit3, color: "from-orange-500 to-red-600" },
    { name: "Optimism", icon: Zap, color: "from-red-500 to-pink-600" }
  ];

  const farcasterFeed = [
    {
      user: "naval.eth",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      time: "2h",
      content: "Just shared a StreamAiX summary of the latest AI alignment research. The insights are 🔥",
      engagement: { shares: 23, likes: 89, replies: 12 }
    },
    {
      user: "vitalik.lens",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      time: "4h",
      content: "The decentralized summarization model on StreamAiX is fascinating. AI + blockchain provenance = the future of knowledge curation",
      engagement: { shares: 156, likes: 342, replies: 67 }
    }
  ];

  const lensFeed = [
    {
      user: "aave.lens",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      time: "1h",
      content: "Minted a new knowledge NFT from my DeFi deep-dive summary 📚✨ Ownership meets wisdom on StreamAiX",
      summary: "\"DeFi 2.0 Architecture Patterns\" - 28 min summary",
      engagement: { mirrors: 45, collects: 23, comments: 18 }
    },
    {
      user: "polygon.lens",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      time: "3h",
      content: "The AI-generated chapter timestamps on StreamAiX are incredibly accurate. Makes navigating long-form content so much easier 🚀",
      engagement: { mirrors: 78, collects: 12, comments: 31 }
    }
  ];

  return (
    <section id="ecosystem" className="py-20">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Social + Ecosystem
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamlessly integrated with your favorite Web3 social platforms
          </p>
        </motion.div>
        
        {/* Platform Logos */}
        <div className="flex justify-center items-center space-x-12 mb-16 flex-wrap gap-8">
          {platforms.map((platform, index) => (
            <motion.div 
              key={platform.name}
              className="flex items-center space-x-3 opacity-70 hover:opacity-100 transition-opacity duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ opacity: 1 }}
              animate={{ y: [-5, 5, -5] }}
              style={{
                animationDuration: "4s",
                animationIterationCount: "infinite",
                animationDelay: `${index * 0.5}s`
              }}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center`}>
                <platform.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-semibold text-foreground">{platform.name}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Mock Social Feeds */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Farcaster Feed */}
          <motion.div 
            className="glass-bg glass-border rounded-2xl p-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Farcaster Activity</h3>
            </div>
            
            <div className="space-y-4">
              {farcasterFeed.map((post, index) => (
                <div key={index} className="bg-card border-glass-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <img src={post.avatar} alt="User avatar" className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-foreground">{post.user}</span>
                        <span className="text-sm text-muted-foreground">{post.time}</span>
                      </div>
                      <p className="text-muted-foreground text-sm">{post.content}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>↗️ {post.engagement.shares} shares</span>
                        <span>❤️ {post.engagement.likes} likes</span>
                        <span>💬 {post.engagement.replies} replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* Lens Feed */}
          <motion.div 
            className="glass-bg glass-border rounded-2xl p-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Lens Activity</h3>
            </div>
            
            <div className="space-y-4">
              {lensFeed.map((post, index) => (
                <div key={index} className="bg-card border-glass-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <img src={post.avatar} alt="User avatar" className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-foreground">{post.user}</span>
                        <span className="text-sm text-muted-foreground">{post.time}</span>
                      </div>
                      <p className="text-muted-foreground text-sm">{post.content}</p>
                      {post.summary && (
                        <div className="bg-muted rounded-lg p-2 mt-2">
                          <div className="text-xs text-muted-foreground">🎯 {post.summary}</div>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>🔄 {post.engagement.mirrors} mirrors</span>
                        <span>🎨 {post.engagement.collects} collects</span>
                        <span>💬 {post.engagement.comments} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Social Sharing Animation */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-4 glass-bg glass-border rounded-xl p-6">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Share2 className="w-6 h-6 text-white" />
            </motion.div>
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </motion.div>
            <div className="flex space-x-2">
              {platforms.slice(0, 3).map((platform, index) => (
                <motion.div 
                  key={platform.name}
                  className={`w-8 h-8 bg-gradient-to-br ${platform.color} rounded-lg`}
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: index * 0.2 
                  }}
                />
              ))}
            </div>
            <div className="text-muted-foreground text-sm">
              One-click sharing across all platforms
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
