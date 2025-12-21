import { Upload, Brain, Coins, Youtube, Mic, Database, Share2, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SectionHeader } from "@/components/ui/section-header";

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: Upload,
      title: "Upload or Link",
      description: "Paste any YouTube, SoundCloud, Twitch, or podcast URL for real processing",
      color: "from-purple-400 via-fuchsia-400 to-cyan-400",
      badgeColor: "bg-purple-500",
      techIcons: [Youtube, Mic, Database]
    },
    {
      number: 2,
      icon: Brain,
      title: "Real AI Processing",
      description: "AI transcribes with 98% accuracy, analyzes and summarizes content",
      color: "from-purple-500 via-fuchsia-500 to-cyan-500",
      badgeColor: "bg-fuchsia-500",
      techBadges: ["AI Transcription", "AI Analysis"]
    },
    {
      number: 3,
      icon: Coins,
      title: "Publish & Earn",
      description: "Store on Arweave, share on Lens/Farcaster, and monetize your knowledge",
      color: "from-cyan-400 via-purple-400 to-fuchsia-400",
      badgeColor: "bg-cyan-500",
      techIcons: [Database, Share2, DollarSign]
    }
  ];

  return (
    <section id="how-it-works" className="py-20 relative overflow-hidden bg-transparent">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <SectionHeader
            title="How It Works"
            subtitle="Hover over each step to learn more"
          />
        </motion.div>
        
        <div className="flex justify-center gap-8 md:gap-16 max-w-5xl mx-auto relative">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <motion.div 
                    className="text-center group cursor-pointer"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    viewport={{ once: true }}
                    data-testid={`step-${step.number}`}
                  >
                    <div className="relative mb-6">
                      <motion.div 
                        className={`w-20 h-20 md:w-24 md:h-24 mx-auto bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-purple-500/50 transition-shadow duration-300`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <step.icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                      </motion.div>
                      <div className={`absolute -top-3 -right-3 w-8 h-8 ${step.badgeColor} rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ring-4 ring-background`}>
                        {step.number}
                      </div>
                    </div>
                    
                    <h3 className="text-base md:text-lg font-bold text-foreground group-hover:text-purple-400 transition-all duration-300">
                      {step.title}
                    </h3>
                  </motion.div>
                </HoverCardTrigger>
                <HoverCardContent 
                  className="w-80 bg-white dark:bg-slate-900 border-gray-200 dark:border-purple-500/30" 
                  side="bottom"
                  data-testid={`step-${step.number}-details`}
                >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${step.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{step.title}</h4>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                    {step.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {step.techIcons && step.techIcons.map((Icon, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                        <Icon className="w-3 h-3" />
                      </div>
                    ))}
                    {step.techBadges && step.techBadges.map((badge, i) => (
                      <span 
                        key={i} 
                        className="text-xs bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-400/30 px-2 py-1 rounded"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
