import { MessageCircle, Users, Image, Edit3, Zap, Share2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import navalAvatar from "@/assets/naval-avatar.svg";
import vitalikAvatar from "@/assets/vitalik-avatar.svg";

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
      avatar: navalAvatar,
      time: "2h",
      content: "Just shared a StreamAiX summary of the latest AI alignment research. The insights are 🔥",
      engagement: { shares: 23, likes: 89, replies: 12 }
    },
    {
      user: "vitalik.lens",
      avatar: vitalikAvatar,
      time: "4h",
      content: "The decentralized summarization model on StreamAiX is fascinating. AI + blockchain provenance = the future of knowledge curation",
      engagement: { shares: 156, likes: 342, replies: 67 }
    }
  ];

  const lensFeed = [
    {
      user: "aave.lens",
      avatar: navalAvatar,
      time: "1h",
      content: "Minted a new knowledge NFT from my DeFi deep-dive summary 📚✨ Ownership meets wisdom on StreamAiX",
      summary: "\"DeFi 2.0 Architecture Patterns\" - 28 min summary",
      engagement: { mirrors: 45, collects: 23, comments: 18 }
    },
    {
      user: "polygon.lens",
      avatar: vitalikAvatar,
      time: "3h",
      content: "The AI-generated chapter timestamps on StreamAiX are incredibly accurate. Makes navigating long-form content so much easier 🚀",
      engagement: { mirrors: 78, collects: 12, comments: 31 }
    }
  ];

  return (
    <section id="ecosystem" className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Social + Ecosystem
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Seamlessly integrated with your favorite Web3 social platforms
          </p>
        </motion.div>
        
        {/* Platform Logos */}
        <div className="flex justify-center items-center flex-wrap gap-4 sm:gap-6 lg:gap-8 mb-6 px-4">
          {platforms.map((platform, index) => (
            <motion.div 
              key={platform.name}
              className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 opacity-70 hover:opacity-100 transition-opacity duration-300"
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
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center`}>
                <platform.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-sm sm:text-lg font-semibold text-foreground text-center sm:text-left">{platform.name}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Social Sharing Animation */}
        <motion.div 
          className="mt-8 sm:mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-2 sm:space-x-4 glass-bg glass-border rounded-xl p-4 sm:p-6 mx-4">
            <motion.div 
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Share2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="hidden sm:block"
            >
              <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
            </motion.div>
            <div className="flex space-x-1 sm:space-x-2">
              {platforms.slice(0, 3).map((platform, index) => (
                <motion.div 
                  key={platform.name}
                  className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br ${platform.color} rounded-lg`}
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: index * 0.2 
                  }}
                />
              ))}
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
              One-click sharing across all platforms
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
