import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Loader2, Clock, Users, Zap, BookOpen, Share2, Heart, Bookmark, Copy, CheckCircle, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function LiveDemo() {
  const [activeView, setActiveView] = useState("raw");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(73);
  const [currentTime, setCurrentTime] = useState("45:23");
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const demoViews = [
    { id: "raw", label: "Raw Audio", icon: Volume2 },
    { id: "transcript", label: "Transcript", icon: BookOpen },
    { id: "summary", label: "TL;DR", icon: Zap },
    { id: "blog", label: "Blog View", icon: BookOpen }
  ];

  const waveformBars = Array.from({ length: 20 }, (_, i) => ({
    height: Math.random() * 60 + 20,
    delay: i * 0.1
  }));

  // Simulate processing progress
  useEffect(() => {
    if (activeView === "raw") {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 100));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeView]);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="real-demo" className="py-12 sm:py-20 bg-gray-100 dark:bg-gray-900 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Live Demo
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Watch StreamAiX transform a 2-hour podcast into digestible insights
          </p>
        </motion.div>
        
        <div className="max-w-6xl mx-auto">
          {/* Demo Controls */}
          <div className="flex justify-center mb-6 sm:mb-8 px-2 sm:px-4">
            <div className="glass-bg glass-border rounded-xl p-1 sm:p-2 grid grid-cols-2 sm:flex sm:space-x-2 gap-1 sm:gap-2 w-full sm:w-auto max-w-md sm:max-w-none">
              {demoViews.map((view) => (
                <Button
                  key={view.id}
                  variant={activeView === view.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView(view.id)}
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2 flex-1 sm:flex-none ${activeView === view.id ? 
                    "bg-indigo-500 text-white" : 
                    "hover:bg-muted"
                  }`}
                >
                  <view.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline sm:inline">{view.label}</span>
                  <span className="xs:hidden sm:hidden text-[10px]">{view.label.split(' ')[0]}</span>
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
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {activeView === "raw" && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                      <img 
                        src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300" 
                        alt="Podcast cover" 
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:mr-4"
                      />
                      <div className="flex-1 w-full sm:w-auto">
                        <h3 className="text-lg sm:text-xl font-semibold">The Future of AI - Episode #247</h3>
                        <p className="text-muted-foreground text-sm sm:text-base">Naval Ravikant & Vitalik Buterin • 2h 34m</p>
                        <div className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2 flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">🔴 Live Processing</Badge>
                          <Badge variant="outline" className="text-xs">AI + Blockchain</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setBookmarked(!bookmarked)}
                          className={`${bookmarked ? "text-yellow-500" : ""} px-2 sm:px-3`}
                        >
                          <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLiked(!liked)}
                          className={`${liked ? "text-red-500" : ""} px-2 sm:px-3`}
                        >
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="px-2 sm:px-3">
                          <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-3 sm:p-6 mb-4 sm:mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <Button 
                            size="sm" 
                            className="bg-indigo-500 rounded-full hover:bg-indigo-600 p-2 sm:p-3"
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? <Pause className="w-4 h-4 sm:w-6 sm:h-6 text-white" /> : <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
                          </Button>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{currentTime} / 2:34:12</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xs sm:text-sm font-medium text-foreground">Processing: {progress}% complete</div>
                          <div className="w-24 sm:w-32 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Waveform */}
                      <div className="mb-3 sm:mb-4">
                        <div className="flex items-end space-x-1 h-16 sm:h-24 opacity-60 mb-2 justify-center overflow-hidden">
                          {waveformBars.slice(0, 15).map((bar, i) => (
                            <motion.div
                              key={i}
                              className={`w-1 sm:w-2 rounded-full ${
                                i < progress / 5 ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                              style={{ height: `${Math.min(bar.height, 40)}px` }}
                              animate={{ 
                                scaleY: isPlaying && i < progress / 5 ? [1, 1.5, 1] : 1 
                              }}
                              transition={{ 
                                duration: 3, 
                                repeat: isPlaying ? Infinity : 0, 
                                ease: "easeInOut",
                                delay: bar.delay 
                              }}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          Real-time audio analysis in progress...
                        </div>
                      </div>
                    </div>
                    
                    {/* Processing Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="glass-bg glass-border rounded-lg p-3 sm:p-4 text-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                          <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-xs sm:text-sm font-medium">Audio Extraction</div>
                        <div className="text-xs text-muted-foreground">Complete</div>
                      </div>
                      <div className="glass-bg glass-border rounded-lg p-3 sm:p-4 text-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                          <Loader2 className="w-3 h-3 sm:w-5 sm:h-5 text-white animate-spin" />
                        </div>
                        <div className="text-xs sm:text-sm font-medium">Transcription</div>
                        <div className="text-xs text-muted-foreground">{progress}% done</div>
                      </div>
                      <div className="glass-bg glass-border rounded-lg p-3 sm:p-4 text-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                          <Zap className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-xs sm:text-sm font-medium">AI Summary</div>
                        <div className="text-xs text-muted-foreground">Queued</div>
                      </div>
                    </div>
                    
                    <div className="text-center text-muted-foreground">
                      <div className="flex items-center justify-center space-x-2 mb-2 flex-wrap">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-indigo-500" />
                        <span className="font-medium text-sm sm:text-base">Whisper AI is analyzing the audio content...</span>
                      </div>
                      <p className="text-xs sm:text-sm px-4">This usually takes 2-3 minutes for a 2-hour podcast</p>
                    </div>
                  </div>
                )}

                {activeView === "transcript" && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                      <h3 className="text-lg sm:text-xl font-semibold">Full Transcript</h3>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleCopy}
                          className="text-xs px-2 sm:px-3"
                        >
                          {copied ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                          {copied ? "Copied!" : "Copy All"}
                        </Button>
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          2 speakers
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-4 sm:space-y-6 text-muted-foreground">
                      <div className="flex space-x-3 sm:space-x-4 p-3 sm:p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                        <div className="flex-shrink-0">
                          <img 
                            src="/src/assets/naval-image.png" 
                            alt="Naval" 
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                            <span className="text-indigo-500 font-medium text-xs sm:text-sm">[00:45:23]</span>
                            <span className="font-medium text-foreground text-sm sm:text-base">Naval Ravikant</span>
                            <Badge variant="outline" className="text-xs w-fit">Key Insight</Badge>
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed">
                            I think the fundamental shift we're seeing with AI is that it's moving from being a tool to being more like a collaborator. 
                            When you have systems that can reason, create, and iterate alongside humans, the traditional boundaries between human and machine 
                            creativity start to blur in fascinating ways.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                        <div className="flex-shrink-0">
                          <img 
                            src="/src/assets/vitalik-image.png" 
                            alt="Vitalik" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-purple-500 font-medium text-sm">[00:46:12]</span>
                            <span className="font-medium text-foreground">Vitalik Buterin</span>
                            <Badge variant="outline" className="text-xs">Technical</Badge>
                          </div>
                          <p className="text-sm leading-relaxed">
                            Exactly, and when you combine that with blockchain technology, you get this interesting property where the AI's decision-making 
                            process becomes transparent and verifiable. Every step of the reasoning can be recorded onchain, creating an audit trail that 
                            builds trust in AI systems.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                        <div className="flex-shrink-0">
                          <img 
                            src="/src/assets/naval-image.png" 
                            alt="Naval" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-indigo-500 font-medium text-sm">[00:47:45]</span>
                            <span className="font-medium text-foreground">Naval Ravikant</span>
                          </div>
                          <p className="text-sm leading-relaxed">
                            The real magic happens when you realize that these AI-generated summaries become digital assets. They're not just text files - 
                            they're valuable knowledge that can be owned, traded, and monetized. That's the paradigm shift we're building towards.
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center text-xs text-muted-foreground mt-4 p-2 border-t">
                        Transcript continues for 2h 27m • Generated by Whisper AI • 97% accuracy
                      </div>
                    </div>
                  </div>
                )}

                {activeView === "summary" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold">Key Insights</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          AI Generated
                        </Badge>
                        <Badge variant="outline" className="text-xs">5 min read</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">AI as Collaborator, Not Tool</h4>
                            <p className="text-muted-foreground mb-3">
                              Naval argues that AI is transitioning from being a simple tool to becoming a true collaborative partner. 
                              This shift fundamentally changes how humans and machines interact in creative and analytical processes.
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Mentioned at 45:23, 52:14, 1:08:45</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Blockchain Enables AI Transparency</h4>
                            <p className="text-muted-foreground mb-3">
                              Vitalik explains how blockchain technology creates transparent, verifiable AI decision-making processes. 
                              Every reasoning step can be recorded onchain, building trust in AI systems through immutable audit trails.
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Mentioned at 46:12, 58:30, 1:15:22</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-cyan-50 to-green-50 dark:from-cyan-900/20 dark:to-green-900/20 p-6 rounded-lg border border-cyan-200 dark:border-cyan-800">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-cyan-700 dark:text-cyan-300 mb-2">Knowledge as Digital Assets</h4>
                            <p className="text-muted-foreground mb-3">
                              The discussion explores how AI-generated summaries become valuable digital assets that can be owned, 
                              traded, and monetized, representing a paradigm shift in how we value and exchange knowledge.
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Mentioned at 47:45, 1:22:10, 1:35:55</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4 mt-6">
                        <h5 className="text-sm font-semibold text-muted-foreground mb-3">Quick Stats</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-indigo-500">23</div>
                            <div className="text-xs text-muted-foreground">Key Points</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-500">8</div>
                            <div className="text-xs text-muted-foreground">Technical Terms</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-cyan-500">15</div>
                            <div className="text-xs text-muted-foreground">References</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-500">97%</div>
                            <div className="text-xs text-muted-foreground">Accuracy</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeView === "blog" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">The Future of AI: Insights from Naval and Vitalik</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>Generated from 2h 34m podcast</span>
                          <span>•</span>
                          <span>8 min read</span>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">AI Summary</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={handleCopy}>
                          {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                    
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-lg border-l-4 border-indigo-500 mb-6">
                        <h4 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">TL;DR</h4>
                        <p className="text-muted-foreground">
                          Naval and Vitalik explore how AI is evolving from tool to collaborator, how blockchain enables transparent AI decisions, 
                          and why AI-generated knowledge represents the next paradigm in digital asset ownership.
                        </p>
                      </div>
                      
                      <h4 className="text-xl font-semibold text-foreground mb-4">The Collaboration Revolution</h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Naval Ravikant opened the discussion by highlighting a fundamental shift in how we interact with AI systems. 
                        Rather than viewing AI as a sophisticated tool, he argues we're entering an era where AI becomes a true collaborative partner.
                      </p>
                      
                      <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-muted-foreground bg-muted p-4 rounded-r-lg mb-4">
                        "When you have systems that can reason, create, and iterate alongside humans, the traditional boundaries 
                        between human and machine creativity start to blur in fascinating ways." - Naval Ravikant
                      </blockquote>
                      
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        This shift has profound implications for how we structure work, creativity, and problem-solving in the future. 
                        Naval emphasizes that the most successful individuals and organizations will be those who learn to effectively 
                        collaborate with AI rather than simply use it as a tool.
                      </p>
                      
                      <h4 className="text-xl font-semibold text-foreground mb-4">Blockchain's Role in AI Transparency</h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Vitalik Buterin expanded on the importance of making AI decision-making processes transparent and verifiable. 
                        He explained how blockchain technology can create immutable records of AI reasoning processes, 
                        addressing one of the key challenges in AI adoption: trust.
                      </p>
                      
                      <div className="bg-muted rounded-lg p-4 mb-4">
                        <h5 className="font-semibold text-foreground mb-2">Key Technical Points:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Every AI decision can be recorded onchain with cryptographic proof</li>
                          <li>Audit trails enable post-hoc analysis of AI reasoning</li>
                          <li>Decentralized verification prevents single points of failure</li>
                          <li>Smart contracts can encode AI governance rules</li>
                        </ul>
                      </div>
                      
                      <blockquote className="border-l-4 border-purple-500 pl-4 italic text-muted-foreground bg-muted p-4 rounded-r-lg mb-6">
                        "Every step of the reasoning can be recorded onchain, creating an audit trail that builds trust in AI systems." - Vitalik Buterin
                      </blockquote>
                      
                      <h4 className="text-xl font-semibold text-foreground mb-4">Knowledge as Digital Assets</h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Perhaps the most revolutionary insight from the conversation was the concept of AI-generated summaries as valuable digital assets. 
                        Both speakers agreed that we're moving toward a world where knowledge itself becomes tokenized and tradeable.
                      </p>
                      
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        This paradigm shift means that creating, curating, and refining knowledge becomes a directly monetizable activity. 
                        StreamAiX represents this future, where every summary, every insight, and every knowledge artifact has inherent value 
                        that can be owned and exchanged.
                      </p>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-6 mt-8">
                      <h5 className="text-lg font-semibold text-foreground mb-4">AI-Generated Chapters</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                            <div>
                              <div className="font-medium text-foreground">Introduction & Context Setting</div>
                              <div className="text-sm text-muted-foreground">Background on AI evolution and current landscape</div>
                            </div>
                          </div>
                          <span className="text-sm text-indigo-500 font-medium">00:00 - 15:30</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                            <div>
                              <div className="font-medium text-foreground">AI as Creative Collaborator</div>
                              <div className="text-sm text-muted-foreground">The shift from tool to collaborative partner</div>
                            </div>
                          </div>
                          <span className="text-sm text-purple-500 font-medium">15:30 - 45:20</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                            <div>
                              <div className="font-medium text-foreground">Blockchain + AI Synergies</div>
                              <div className="text-sm text-muted-foreground">How blockchain enables transparent AI systems</div>
                            </div>
                          </div>
                          <span className="text-sm text-cyan-500 font-medium">45:20 - 1:20:15</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                            <div>
                              <div className="font-medium text-foreground">Future of Knowledge Assets</div>
                              <div className="text-sm text-muted-foreground">Monetizing and trading AI-generated insights</div>
                            </div>
                          </div>
                          <span className="text-sm text-green-500 font-medium">1:20:15 - 2:34:12</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-8 pt-6 border-t">
                      <div className="flex items-center space-x-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLiked(!liked)}
                          className={liked ? "text-red-500 border-red-200" : ""}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          {liked ? "Liked" : "Like"} (127)
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setBookmarked(!bookmarked)}
                          className={bookmarked ? "text-yellow-500 border-yellow-200" : ""}
                        >
                          <Bookmark className="w-4 h-4 mr-1" />
                          {bookmarked ? "Saved" : "Save"}
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Generated by StreamAiX • Stored on Arweave • Accuracy: 97%
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
