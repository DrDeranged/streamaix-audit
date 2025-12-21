import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Brain, Mic, Database, CheckCircle, ArrowRight } from "lucide-react";

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
      className="hidden md:block py-3 bg-gradient-to-r from-purple-500/90 via-purple-500/90 to-cyan-500/90 text-white relative overflow-hidden backdrop-blur-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-full h-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
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
          <Badge className="bg-white/20 text-white border-white/30 font-medium text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            REAL AI PROCESSING
          </Badge>
          <span className="text-sm font-medium">
            Now powered by Advanced AI
          </span>

        </div>
      </div>
    </motion.section>
  );
}