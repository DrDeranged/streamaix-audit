import { Upload, Brain, Coins, Youtube, Mic, Database, Share2, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: Upload,
      title: "Upload or Link",
      description: "Paste any YouTube, SoundCloud, Twitch, or podcast URL for real processing",
      color: "from-indigo-500 to-purple-600",
      badgeColor: "bg-blue-500",
      techIcons: [Youtube, Mic, Database]
    },
    {
      number: 2,
      icon: Brain,
      title: "Real AI Processing",
      description: "OpenAI Whisper transcribes with 98% accuracy, GPT-4o analyzes and summarizes",
      color: "from-purple-500 to-cyan-500",
      badgeColor: "bg-purple-500",
      techBadges: ["OpenAI Whisper", "GPT-4o"]
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
    <section id="how-it-works" className="py-12 relative">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hover over each step to learn more
          </p>
        </motion.div>
        
        <div className="flex justify-center gap-6 md:gap-12 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <HoverCard key={step.number} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <motion.div 
                  className="text-center group cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  data-testid={`step-${step.number}`}
                >
                  <div className="relative mb-4">
                    <motion.div 
                      className={`w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <step.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </motion.div>
                    <div className={`absolute -top-2 -right-2 w-6 h-6 ${step.badgeColor} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
                      {step.number}
                    </div>
                  </div>
                  
                  <h3 className="text-base md:text-lg font-semibold text-foreground group-hover:text-indigo-500 transition-colors">
                    {step.title}
                  </h3>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent 
                className="w-80 glass-bg glass-border" 
                side="bottom"
                data-testid={`step-${step.number}-details`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${step.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-foreground">{step.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {step.techIcons && step.techIcons.map((Icon, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon className="w-3 h-3" />
                      </div>
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
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}
