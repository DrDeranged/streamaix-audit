import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SummaryCard } from "./summary-card";
import { Sparkles, Brain, Zap, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function SummariesFeed() {
  const { data: summaries, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/summaries'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.15) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-full blur-3xl"
        animate={{
          y: [-20, 40, -20],
          x: [-10, 20, -10],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl"
        animate={{
          y: [-30, 30, -30],
          x: [-20, 10, -20],
          scale: [1.2, 1, 1.2],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 backdrop-blur-sm mb-6">
            <Brain className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">AI-Powered Summaries</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-orbitron font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              Knowledge Feed
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover AI-transformed content from across the web. Long videos condensed into{' '}
            <span className="text-indigo-400 font-semibold">digestible insights</span>,
            ready to read in minutes.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-6 mb-12"
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-2xl font-bold text-white">{summaries?.length || 0}</div>
              <div className="text-xs text-gray-400">Summaries</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-2xl font-bold text-white">GPT-4o</div>
              <div className="text-xs text-gray-400">AI Model</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
            <Brain className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-white">95%+</div>
              <div className="text-xs text-gray-400">Accuracy</div>
            </div>
          </div>
        </motion.div>

        {/* Summaries Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading summaries...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Unable to load summaries. Please try again later.</p>
          </div>
        ) : summaries && summaries.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {summaries.slice(0, 6).map((summary: any, index: number) => (
                <SummaryCard key={summary.id} summary={summary} index={index} />
              ))}
            </div>

            {/* View All Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 group"
                data-testid="button-explore-all"
              >
                <Link href="/discover">
                  <span>Explore All Summaries</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No summaries available yet.</p>
            <p className="text-gray-500 text-sm mt-2">Be the first to create one!</p>
          </div>
        )}
      </div>
    </section>
  );
}
