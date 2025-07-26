import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, Users } from "lucide-react";
import { motion } from "framer-motion";

export function AISuggestions() {
  const suggestions = [
    {
      icon: Sparkles,
      title: "Suggested for You",
      color: "text-indigo-400",
      items: [
        {
          image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          title: "The Mathematics of AI Alignment",
          duration: "25-min summary",
          source: "Stuart Russell lecture",
          tag: "AI Safety",
          tagColor: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300",
          match: "95% match"
        },
        {
          image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          title: "Layer 2 Scaling Solutions",
          duration: "18-min summary",
          source: "Ethereum Foundation",
          tag: "Blockchain",
          tagColor: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
          match: "87% match"
        }
      ]
    },
    {
      icon: Brain,
      title: "Your AI Agent Recommends",
      color: "text-purple-400",
      items: [
        {
          image: "@assets/image_1753489943045.png",
          title: "Quantum Computing Breakthrough",
          duration: "32-min summary",
          source: "IBM Research",
          tag: "Quantum",
          tagColor: "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300",
          match: "Agent pick"
        },
        {
          image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          title: "AGI Timeline Predictions",
          duration: "45-min summary",
          source: "OpenAI panel",
          tag: "Future Tech",
          tagColor: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
          match: "Trending"
        }
      ]
    },
    {
      icon: Users,
      title: "What Farcaster is Watching",
      color: "text-cyan-400",
      items: [
        {
          image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          title: "Creator Economy Evolution",
          duration: "28-min summary",
          source: "a16z podcast",
          tag: "Web3",
          tagColor: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
          match: "327 views"
        },
        {
          image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          title: "DeFi 2.0 Deep Dive",
          duration: "52-min summary",
          source: "Bankless",
          tag: "DeFi",
          tagColor: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
          match: "189 views"
        }
      ]
    }
  ];

  return (
    <section id="suggestions" className="py-20">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            AI-Powered Suggestions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Intelligent content recommendations based on your interests and social graph
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {suggestions.map((section, sectionIndex) => (
            <motion.div 
              key={section.title}
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <section.icon className={`w-5 h-5 mr-2 ${section.color}`} />
                {section.title}
              </h3>
              
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.title}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-card border-glass-border hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 cursor-pointer">
                      <CardContent className="p-4">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-24 object-cover rounded-lg mb-3"
                        />
                        <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.duration} • {item.source}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded ${item.tagColor}`}>
                            {item.tag}
                          </span>
                          <span className={`text-xs ${
                            section.title.includes("Agent") ? "text-purple-500" : 
                            section.title.includes("Farcaster") ? "text-cyan-500" : 
                            "text-gray-500"
                          } font-medium`}>
                            {item.match}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
