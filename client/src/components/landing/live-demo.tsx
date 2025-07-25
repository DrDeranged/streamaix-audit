import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function LiveDemo() {
  const [activeView, setActiveView] = useState("raw");

  const demoViews = [
    { id: "raw", label: "Raw Audio" },
    { id: "transcript", label: "Transcript" },
    { id: "summary", label: "TL;DR" },
    { id: "blog", label: "Blog View" }
  ];

  const waveformBars = Array.from({ length: 15 }, (_, i) => ({
    height: Math.random() * 60 + 20,
    delay: i * 0.1
  }));

  return (
    <section id="demo" className="py-20 bg-gray-100 dark:bg-gray-900 relative">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Live Demo
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch StreamAiX transform a 2-hour podcast into digestible insights
          </p>
        </motion.div>
        
        <div className="max-w-6xl mx-auto">
          {/* Demo Controls */}
          <div className="flex justify-center mb-8">
            <div className="glass-bg glass-border rounded-xl p-2 flex space-x-2 flex-wrap gap-2">
              {demoViews.map((view) => (
                <Button
                  key={view.id}
                  variant={activeView === view.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView(view.id)}
                  className={activeView === view.id ? 
                    "bg-indigo-500 text-white" : 
                    "hover:bg-muted"
                  }
                >
                  {view.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Demo Content */}
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card border-glass-border shadow-xl">
              <CardContent className="p-8">
                {activeView === "raw" && (
                  <div>
                    <div className="flex items-center mb-6">
                      <img 
                        src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300" 
                        alt="Podcast cover" 
                        className="w-16 h-16 rounded-lg mr-4"
                      />
                      <div>
                        <h3 className="text-xl font-semibold">The Future of AI - Episode #247</h3>
                        <p className="text-muted-foreground">Naval Ravikant & Vitalik Buterin • 2h 34m</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <Button size="icon" className="bg-indigo-500 rounded-full">
                            <Play className="w-6 h-6 text-white" />
                          </Button>
                          <span className="text-sm text-muted-foreground">45:23 / 2:34:12</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Processing: 73% complete</div>
                      </div>
                      
                      {/* Waveform */}
                      <div className="flex items-end space-x-1 h-20 opacity-60">
                        {waveformBars.map((bar, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-indigo-400 rounded-full"
                            style={{ height: `${bar.height}px` }}
                            animate={{ scaleY: [1, 1.5, 1] }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity, 
                              ease: "easeInOut",
                              delay: bar.delay 
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p>AI is analyzing the audio content...</p>
                    </div>
                  </div>
                )}

                {activeView === "transcript" && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Full Transcript</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <div className="flex space-x-3">
                        <span className="text-indigo-500 font-medium">[00:45:23]</span>
                        <div>
                          <span className="font-medium">Naval:</span> I think the fundamental shift we're seeing with AI is that it's moving from being a tool to being more like a collaborator...
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <span className="text-purple-500 font-medium">[00:46:12]</span>
                        <div>
                          <span className="font-medium">Vitalik:</span> Exactly, and when you combine that with blockchain technology, you get this interesting property where the AI's decision-making process becomes transparent and verifiable...
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeView === "summary" && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Key Insights</h3>
                    <div className="space-y-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">AI as Collaborator</h4>
                        <p className="text-muted-foreground">Discussion on AI evolution from tool to collaborative partner in creative and analytical work.</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Blockchain + AI Transparency</h4>
                        <p className="text-muted-foreground">How blockchain enables verifiable AI decision-making and trustless automation.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeView === "blog" && (
                  <div className="prose dark:prose-invert max-w-none">
                    <h3>The Future of AI: Insights from Naval and Vitalik</h3>
                    <p className="text-muted-foreground text-sm mb-4">Generated from 2h 34m podcast • AI-timestamped chapters</p>
                    
                    <h4>The Collaboration Revolution</h4>
                    <p>Naval Ravikant opened the discussion by highlighting a fundamental shift in how we interact with AI systems...</p>
                    
                    <h4>Blockchain's Role in AI Transparency</h4>
                    <p>Vitalik Buterin expanded on the importance of making AI decision-making processes transparent and verifiable...</p>
                    
                    <div className="bg-muted p-4 rounded-lg mt-6">
                      <h5 className="text-sm font-semibold text-muted-foreground mb-2">AI-Generated Chapters</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Introduction & Context</span>
                          <span className="text-indigo-500">00:00 - 15:30</span>
                        </div>
                        <div className="flex justify-between">
                          <span>AI as Creative Collaborator</span>
                          <span className="text-indigo-500">15:30 - 45:20</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Blockchain + AI Synergies</span>
                          <span className="text-indigo-500">45:20 - 1:20:15</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
