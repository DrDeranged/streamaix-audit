import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export function Bounties() {
  const bounties = [
    {
      creator: {
        name: "@naval.eth",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        postedTime: "2h ago"
      },
      title: "Summarize ETH Global Keynote",
      description: "Create a comprehensive summary of Vitalik's keynote on blockchain scalability (2h 15min video)",
      reward: "25 $STREAM",
      rewardColor: "from-green-500 to-teal-500",
      timeLeft: "3 days left",
      tipPool: "$127",
      tags: ["Blockchain", "Technical"],
      tagColors: ["bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300", "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"],
      buttonColor: "from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
    },
    {
      creator: {
        name: "@vitalik.lens",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        postedTime: "5h ago"
      },
      title: "AI Safety Research Panel",
      description: "Summarize the Stanford AI Safety panel with key insights and actionable takeaways",
      reward: "40 $STREAM",
      rewardColor: "from-purple-500 to-pink-500",
      timeLeft: "5 days left",
      tipPool: "$203",
      tags: ["AI Safety", "Research"],
      tagColors: ["bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300", "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"],
      buttonColor: "from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
    },
    {
      creator: {
        name: "@balajis.eth",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        postedTime: "1d ago"
      },
      title: "DeFi Protocols Deep Dive",
      description: "Break down the latest DeFi innovations and protocols in an accessible summary",
      reward: "15 $STREAM",
      rewardColor: "from-cyan-500 to-blue-500",
      timeLeft: "2 days left",
      tipPool: "$89",
      tags: ["DeFi", "Finance"],
      tagColors: ["bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300", "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"],
      buttonColor: "from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
    }
  ];

  const stats = [
    { value: "1,247", label: "Active Bounties", color: "text-indigo-500" },
    { value: "$52.8k", label: "Total Rewards", color: "text-purple-500" },
    { value: "3,892", label: "Summaries Created", color: "text-cyan-500" },
    { value: "24h", label: "Avg Completion", color: "text-green-500" }
  ];

  return (
    <section id="bounties" className="py-20 bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Summary Bounty Board
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Earn $STREAM tokens by creating valuable summaries and completing bounties
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {bounties.map((bounty, index) => (
            <motion.div
              key={bounty.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="bg-card border-glass-border shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={bounty.creator.avatar} 
                        alt="Creator avatar" 
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{bounty.creator.name}</p>
                        <p className="text-xs text-muted-foreground">{bounty.creator.postedTime}</p>
                      </div>
                    </div>
                    <div className={`bg-gradient-to-r ${bounty.rewardColor} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                      {bounty.reward}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {bounty.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4">
                    {bounty.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>⏰ {bounty.timeLeft}</span>
                    <span>💰 Tip Pool: {bounty.tipPool}</span>
                  </div>
                  
                  <div className="flex space-x-2 mb-4 flex-wrap gap-2">
                    {bounty.tags.map((tag, tagIndex) => (
                      <span 
                        key={tag}
                        className={`text-xs px-2 py-1 rounded ${bounty.tagColors[tagIndex]}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full bg-gradient-to-r ${bounty.buttonColor} text-white transition-all duration-300`}
                  >
                    Claim Bounty
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Stats Section */}
        <motion.div 
          className="mt-16 grid md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
