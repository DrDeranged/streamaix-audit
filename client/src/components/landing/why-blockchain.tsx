import { Database, Coins, UserCheck, ShieldCheck, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function WhyBlockchain() {
  const features = [
    {
      icon: Database,
      title: "Onchain Memory",
      description: "Your summaries are permanently stored on Arweave. Never lose valuable knowledge again.",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: Coins,
      title: "Tokenized Summaries",
      description: "Each summary becomes an NFT that can be traded, collected, and monetized.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: UserCheck,
      title: "Creator Ownership",
      description: "You own your content and control how it's used, shared, and monetized.",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: ShieldCheck,
      title: "AI-Traceable Provenance",
      description: "Every AI operation is recorded onchain for complete transparency and accountability.",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: Users,
      title: "Social Curation",
      description: "Community-driven quality control through Lens and Farcaster social graphs.",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Zap,
      title: "Instant Rewards",
      description: "Earn $STREAM tokens for creating valuable summaries and curating content.",
      color: "from-yellow-500 to-orange-600"
    }
  ];

  const ecosystemLogos = [
    { name: "Arweave", color: "from-purple-500 to-pink-600" },
    { name: "Lens", color: "from-green-500 to-teal-600" },
    { name: "Farcaster", color: "from-indigo-500 to-blue-600" },
    { name: "Optimism", color: "from-orange-500 to-red-600" }
  ];

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Why Blockchain?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Web3 infrastructure brings unique advantages to AI-generated content
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title}
              className="glass-bg glass-border rounded-2xl p-6 hover:bg-muted/50 transition-all duration-300 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Animated ecosystem logos */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground mb-8">Powered by the best Web3 infrastructure</p>
          <div className="flex justify-center items-center space-x-8 opacity-60 flex-wrap gap-4">
            {ecosystemLogos.map((logo, index) => (
              <motion.div 
                key={logo.name}
                className="flex items-center space-x-2"
                animate={{ y: [-5, 5, -5] }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: index * 0.5 
                }}
              >
                <div className={`w-8 h-8 bg-gradient-to-br ${logo.color} rounded-lg`} />
                <span className="text-sm">{logo.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
