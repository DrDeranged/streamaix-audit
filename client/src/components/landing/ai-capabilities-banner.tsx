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
    { icon: Zap, text: "GPT-4o Analysis", detail: "Comprehensive summaries" },
    { icon: Database, text: "Decentralized Storage", detail: "IPFS + Arweave" }
  ];

  return (
    <motion.section 
      className="py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white relative overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
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
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Main announcement */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-white/30 font-semibold">
                ✨ NOW LIVE
              </Badge>
              <Badge className="bg-green-500/20 text-green-100 border-green-300/50 font-semibold">
                <CheckCircle className="w-3 h-3 mr-1" />
                FULLY FUNCTIONAL
              </Badge>
            </div>
            
            <h3 className="text-lg sm:text-xl font-bold mb-1">
              Real AI Processing is Live!
            </h3>
            <p className="text-sm sm:text-base text-white/90">
              StreamAiX now processes any video/podcast URL with actual AI - no more mock data!
            </p>
          </div>

          {/* Capabilities grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            {capabilities.map((cap, index) => (
              <motion.div
                key={cap.text}
                className="flex flex-col items-center gap-1 p-2 glass-bg glass-border rounded-lg bg-white/10 border-white/20"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <cap.icon className="w-4 h-4 text-white" />
                <span className="text-xs font-medium">{cap.text}</span>
                <span className="text-xs text-white/70">{cap.detail}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={scrollToDemo}
              className="bg-white text-indigo-600 hover:bg-white/90 font-semibold px-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              data-testid="button-try-real-ai"
            >
              Try Real AI Processing
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}