import { Database, Coins, UserCheck, ShieldCheck, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";

export function WhyBlockchain() {
  const features = [
    {
      icon: Database,
      title: "Onchain Memory",
      description: "Your summaries are permanently stored on Arweave. Never lose valuable knowledge again.",
      color: "bg-accent-core"
    },
    {
      icon: Coins,
      title: "Tokenized Summaries",
      description: "Each summary becomes an NFT that can be traded, collected, and monetized.",
      color: "bg-accent-deep"
    },
    {
      icon: UserCheck,
      title: "Creator Ownership",
      description: "You own your content and control how it's used, shared, and monetized.",
      color: "bg-gain"
    },
    {
      icon: ShieldCheck,
      title: "AI-Traceable Provenance",
      description: "Every AI operation is recorded onchain for complete transparency and accountability.",
      color: "bg-warn"
    },
    {
      icon: Users,
      title: "Social Curation",
      description: "Community-driven quality control through Lens and Farcaster social graphs.",
      color: "bg-loss"
    },
    {
      icon: Zap,
      title: "Instant Rewards",
      description: "Earn STREAM points for creating valuable summaries and curating content.",
      color: "bg-accent-core"
    }
  ];

  return (
    <section id="features" className="py-12 bg-transparent">
       <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
           <SectionTitle as="h2">Why Blockchain?</SectionTitle>
           <p className="mt-2 text-sm text-secondary">Hover to explore Web3 advantages</p>
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
                   className={`w-14 h-14 md:w-16 md:h-16 mx-auto ${feature.color} rounded-xl flex items-center justify-center mb-2`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                     <feature.icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                  </motion.div>
                   <h3 className="text-xs md:text-sm font-semibold text-primary group-hover:text-accent-bright transition-colors">
                    {feature.title}
                  </h3>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent 
                 className="w-72 border-0 bg-transparent p-0" 
                side="top"
                data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}-details`}
              >
                 <Surface variant="raised" className="space-y-2 border border-ink-edge p-4">
                   <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                       <feature.icon className="w-5 h-5 text-primary" />
                     </div>
                     <h4 className="font-semibold text-primary">{feature.title}</h4>
                   </div>
                   <p className="text-sm text-body leading-relaxed">
                     {feature.description}
                   </p>
                 </Surface>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}
