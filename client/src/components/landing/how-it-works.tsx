import { Upload, Brain, Coins, Youtube, Mic, Database, Share2, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import SectionTitle from "@/components/ds/SectionTitle";
import Surface from "@/components/ds/Surface";

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: Upload,
      title: "Upload or Link",
      description: "Paste any YouTube, SoundCloud, Twitch, or podcast URL for real processing",
      color: "bg-accent-core",
      badgeColor: "bg-accent-deep",
      techIcons: [Youtube, Mic, Database]
    },
    {
      number: 2,
      icon: Brain,
      title: "Real AI Processing",
      description: "AI transcribes with 98% accuracy, analyzes and summarizes content",
      color: "bg-accent-deep",
      badgeColor: "bg-accent-core",
      techBadges: ["AI Transcription", "AI Analysis"]
    },
    {
      number: 3,
      icon: Coins,
      title: "Publish & Earn",
      description: "Store on Arweave, share on Lens/Farcaster, and monetize your knowledge",
      color: "bg-accent-core",
      badgeColor: "bg-accent-deep",
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
          <SectionTitle>How It Works</SectionTitle>
          <p className="mt-2 text-sm text-secondary">Hover over each step to learn more</p>
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
                        className={`w-20 h-20 md:w-24 md:h-24 mx-auto ${step.color} rounded-xl flex items-center justify-center border border-accent-core/40 shadow-lg group-hover:glow-accent transition-shadow duration-300`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                         <step.icon className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                      </motion.div>
                      <div className={`absolute -top-3 -right-3 w-8 h-8 ${step.badgeColor} rounded-xl flex items-center justify-center text-sm font-bold text-primary shadow-lg ring-4 ring-ink-page tabular`}>
                        {step.number}
                      </div>
                    </div>
                    
                     <h3 className="text-base md:text-lg font-bold text-primary group-hover:text-accent-bright transition-all duration-300">
                      {step.title}
                    </h3>
                  </motion.div>
                </HoverCardTrigger>
                <HoverCardContent 
                    className="w-80 border border-ink-edge bg-ink-surface p-0"
                  side="bottom"
                  data-testid={`step-${step.number}-details`}
                >
                 <Surface variant="raised" className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 ${step.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                       <step.icon className="w-5 h-5 text-primary" />
                    </div>
                     <h4 className="font-semibold text-primary">{step.title}</h4>
                  </div>
                   <p className="text-sm text-body leading-relaxed">
                    {step.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {step.techIcons && step.techIcons.map((Icon, i) => (
                       <div key={i} className="flex items-center gap-1 text-xs text-secondary">
                        <Icon className="w-3 h-3" />
                      </div>
                    ))}
                    {step.techBadges && step.techBadges.map((badge, i) => (
                      <span 
                        key={i} 
                         className="rounded-xl border border-accent-core/30 bg-accent-core/20 px-2 py-1 text-xs text-accent-bright"
                      >
                        {badge}
                      </span>
                    ))}
                   </div>
                 </Surface>
                </HoverCardContent>
              </HoverCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
