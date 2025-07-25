import { Upload, Brain, Coins, Youtube, Mic, Database, Share2, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: Upload,
      title: "Upload or Link",
      description: "Drop your video file or paste a YouTube, Twitch, or podcast URL",
      color: "from-indigo-500 to-purple-600",
      badgeColor: "bg-blue-500",
      techIcons: [Youtube, Mic, Database]
    },
    {
      number: 2,
      icon: Brain,
      title: "AI Processing",
      description: "Advanced AI creates clean summaries, key insights, and timestamped chapters",
      color: "from-purple-500 to-cyan-500",
      badgeColor: "bg-purple-500",
      techBadges: ["Whisper", "GPT-4"]
    },
    {
      number: 3,
      icon: Coins,
      title: "Publish & Earn",
      description: "Store on Arweave, share on Lens/Farcaster, and monetize your knowledge",
      color: "from-cyan-500 to-green-500",
      badgeColor: "bg-orange-500",
      techIcons: [Database, Share2, DollarSign]
    }
  ];

  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform any video content into valuable, ownable knowledge
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div 
              key={step.number}
              className="text-center group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="relative mb-6">
                <motion.div 
                  className={`w-20 h-20 mx-auto bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <step.icon className="w-10 h-10 text-white" />
                </motion.div>
                <div className={`absolute -top-2 -right-2 w-6 h-6 ${step.badgeColor} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
                  {step.number}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground mb-4">{step.description}</p>
              
              <div className="flex justify-center space-x-2 opacity-60">
                {step.techIcons && step.techIcons.map((Icon, i) => (
                  <Icon key={i} className="w-4 h-4" />
                ))}
                {step.techBadges && step.techBadges.map((badge, i) => (
                  <span 
                    key={i} 
                    className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
