import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Mic, Database, CheckCircle } from "lucide-react";

export function AICapabilitiesBanner() {
  const scrollToDemo = () => {
    document.getElementById('real-demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const capabilities = [
    { icon: Mic, text: "Real Audio Extraction", detail: "yt-dlp + ffmpeg" },
    { icon: Brain, text: "OpenAI Whisper AI", detail: "98% accuracy transcription" },
    { icon: Zap, text: "AI Analysis", detail: "Comprehensive summaries" },
    { icon: Database, text: "Decentralized Storage", detail: "IPFS + Arweave" }
  ];

  return (
    <motion.section 
      className="hidden md:block relative overflow-hidden border-y border-ink-edge bg-ink-surface py-3 text-body"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute w-full h-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-accent-core"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex items-center justify-center gap-4 text-center">
          <Badge className="rounded-xl border border-accent-core/30 bg-accent-core/10 text-accent-bright font-medium text-xs">
            <CheckCircle className="mr-1 h-3 w-3 text-gain" />
            REAL AI PROCESSING
          </Badge>
          <span className="text-sm font-medium text-primary">
            Now powered by Advanced AI
          </span>

        </div>
      </div>
    </motion.section>
  );
}