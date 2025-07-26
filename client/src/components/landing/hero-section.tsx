import { Button } from "@/components/ui/button";
import { Play, Mail, Brain, Link2, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  const scrollToDemo = () => {
    const element = document.getElementById("demo");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-lg"
          animate={{ y: [-15, 25, -15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full blur-2xl"
          animate={{ y: [-25, 15, -25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        
        {/* Animated waveform */}
        <div className="absolute bottom-20 left-0 right-0 flex items-end justify-center space-x-1 opacity-30">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-1 bg-gradient-to-t from-indigo-500 to-purple-600 rounded-full ${
                i % 3 === 0 ? 'h-16' : i % 2 === 0 ? 'h-12' : 'h-8'
              }`}
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 0.1 
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative mb-12 max-w-2xl mx-auto">
            {/* Minimalistic tagline with creative typography */}
            <div className="text-center relative">
              {/* Background subtle grid pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>
              
              <h1 className="relative text-3xl md:text-4xl font-mono tracking-wider leading-relaxed">
                {/* First line with striking visual contrast */}
                <div className="mb-4 flex items-center justify-center gap-3">
                  <span className="text-slate-400/70 font-light text-lg">Stream the</span>
                  <span className="relative">
                    <span className="text-red-400 font-semibold line-through decoration-2 decoration-red-500/60 decoration-wavy">
                      Noise
                    </span>
                    {/* Subtle X mark overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-0.5 bg-red-500 rotate-45 opacity-30"></div>
                      <div className="w-4 h-0.5 bg-red-500 -rotate-45 opacity-30 absolute"></div>
                    </div>
                  </span>
                </div>
                
                {/* Second line with emphasis */}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-slate-400/70 font-light text-lg">Capture the</span>
                  <span className="relative group">
                    <span className="text-cyan-300 font-semibold tracking-tight">
                      Signal
                    </span>
                    {/* Animated underline */}
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-400 group-hover:w-full transition-all duration-700 ease-out"></div>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 text-cyan-300 font-semibold tracking-tight opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500">
                      Signal
                    </div>
                  </span>
                </div>
              </h1>
              
              {/* Minimalistic accent elements */}
              <div className="absolute -top-6 left-1/4 w-1 h-1 bg-red-400/40 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-6 right-1/3 w-0.5 h-0.5 bg-cyan-400/60 rounded-full"></div>
              <div className="absolute top-1/2 -left-8 w-0.5 h-4 bg-gradient-to-b from-transparent to-indigo-400/20"></div>
              <div className="absolute top-1/2 -right-8 w-0.5 h-4 bg-gradient-to-t from-transparent to-purple-400/20"></div>
            </div>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            AI + Web3 platform that transforms long videos into rich, summarized blog posts.
            <span className="text-indigo-500 font-semibold"> Decentralized. Monetizable. Ownable.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg"
              onClick={scrollToDemo}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 animate-pulse-glow"
            >
              <Play className="w-5 h-5 mr-2" />
              Try the Demo
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="px-8 py-4 glass-bg glass-border hover:bg-muted transform hover:scale-105 transition-all duration-300"
            >
              <Mail className="w-5 h-5 mr-2" />
              Join Waitlist
            </Button>
          </div>
          
          {/* Tech stack indicators */}
          <div className="flex justify-center items-center space-x-8 opacity-60 flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span className="text-sm">GPT-4</span>
            </div>
            <div className="flex items-center space-x-2">
              <Link2 className="w-5 h-5 text-purple-400" />
              <span className="text-sm">IPFS</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="text-sm">Arweave</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-sm">Lens Protocol</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
