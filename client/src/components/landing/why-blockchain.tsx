import { Database, Coins, UserCheck, ShieldCheck, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function WhyBlockchain() {
  const features = [
    {
      icon: Database,
      title: "Onchain Memory",
      description: "Your summaries are permanently stored on Arweave. Never lose valuable knowledge again.",
      color: "from-purple-400 via-fuchsia-400 to-cyan-400"
    },
    {
      icon: Coins,
      title: "Tokenized Summaries",
      description: "Each summary becomes an NFT that can be traded, collected, and monetized.",
      color: "from-purple-500 via-fuchsia-500 to-cyan-500"
    },
    {
      icon: UserCheck,
      title: "Creator Ownership",
      description: "You own your content and control how it's used, shared, and monetized.",
      color: "from-cyan-400 via-purple-400 to-fuchsia-400"
    },
    {
      icon: ShieldCheck,
      title: "AI-Traceable Provenance",
      description: "Every AI operation is recorded onchain for complete transparency and accountability.",
      color: "from-fuchsia-400 via-purple-400 to-cyan-400"
    },
    {
      icon: Users,
      title: "Social Curation",
      description: "Community-driven quality control through Lens and Farcaster social graphs.",
      color: "from-purple-500 via-cyan-500 to-fuchsia-500"
    },
    {
      icon: Zap,
      title: "Instant Rewards",
      description: "Earn $STREAM tokens for creating valuable summaries and curating content.",
      color: "from-cyan-500 via-fuchsia-500 to-purple-500"
    }
  ];

  const ecosystemLogos = [
    { name: "Arweave", color: "from-purple-500 to-fuchsia-500" },
    { name: "Lens", color: "from-fuchsia-500 to-cyan-500" },
    { name: "Farcaster", color: "from-cyan-500 to-purple-500" },
    { name: "Optimism", color: "from-purple-400 to-cyan-400" }
  ];

  return (
    <section id="features" className="py-12">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-orbitron font-bold mb-4 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Why Blockchain?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hover to explore Web3 advantages
          </p>
        </motion.div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <HoverCard key={feature.title} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <motion.div 
                  className="text-center group cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <motion.div 
                    className={`w-14 h-14 md:w-16 md:h-16 mx-auto bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-2`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <feature.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xs md:text-sm font-semibold text-foreground group-hover:text-purple-400 transition-colors">
                    {feature.title}
                  </h3>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent 
                className="w-72 glass-bg glass-border" 
                side="top"
                data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}-details`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
        
        {/* Animated ecosystem logos - more compact */}
        <motion.div 
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-muted-foreground mb-4">Powered by</p>
          <div className="flex justify-center items-center space-x-6 opacity-60 flex-wrap gap-3">
            {ecosystemLogos.map((logo, index) => (
              <motion.div 
                key={logo.name}
                className="flex items-center space-x-2"
                animate={{ y: [-3, 3, -3] }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: index * 0.5 
                }}
              >
                <div className={`w-6 h-6 bg-gradient-to-br ${logo.color} rounded-lg`} />
                <span className="text-xs">{logo.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
