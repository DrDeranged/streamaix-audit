import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  UserPlus, 
  FileText, 
  Target, 
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRef } from "react";

export function RecentActivity() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['/api/activity'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const activities = activityData?.activities || [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollPosition = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-20 relative overflow-hidden bg-transparent">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-orbitron font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-purple-400 dark:via-fuchsia-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Live Platform Activity
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Real-time actions from our community of AI hunters and traders
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
            
            {/* Main card */}
            <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 dark:from-slate-900/95 dark:via-purple-900/40 dark:to-slate-900/95 backdrop-blur-2xl border border-purple-500/20 dark:border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 border border-purple-400/50">
                      <Activity className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Recent Actions</h3>
                      <p className="text-sm text-gray-400">Latest activity across all features</p>
                    </div>
                  </div>
                  
                  {/* Navigation arrows */}
                  {!isLoading && activities.length > 2 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => scroll('left')}
                        className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 group/btn"
                        data-testid="scroll-left-button"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="w-5 h-5 text-purple-300 group-hover/btn:text-purple-200" />
                      </button>
                      <button
                        onClick={() => scroll('right')}
                        className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 group/btn"
                        data-testid="scroll-right-button"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="w-5 h-5 text-purple-300 group-hover/btn:text-purple-200" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Horizontal Scroll Container */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    <span className="ml-3 text-gray-400">Loading activity...</span>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="relative">
                    <div
                      ref={scrollContainerRef}
                      className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-purple-500/10 hover:scrollbar-thumb-purple-500/70"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(168, 85, 247, 0.5) rgba(168, 85, 247, 0.1)'
                      }}
                      data-testid="activity-scroll-container"
                    >
                      {activities.map((activity: any, index: number) => {
                        const Icon = activity.type === 'user' ? UserPlus :
                                     activity.type === 'summary' ? FileText :
                                     activity.type === 'bounty' ? Target :
                                     activity.type === 'market' ? TrendingUp : Activity;
                        
                        const iconColor = activity.type === 'user' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                         activity.type === 'summary' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                                         activity.type === 'bounty' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                         'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

                        return (
                          <motion.div
                            key={`${activity.type}-${activity.id}-${index}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex-shrink-0 w-80 p-4 rounded-xl bg-slate-900/50 dark:bg-slate-800/30 border border-purple-500/10 hover:border-purple-500/30 hover:bg-slate-900/70 dark:hover:bg-slate-800/50 transition-all duration-300"
                            data-testid={`activity-item-${index}`}
                          >
                            <div className="flex flex-col h-full">
                              <div className="flex items-start gap-3 mb-3">
                                <div className={`p-2.5 rounded-lg ${iconColor} transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-white text-sm leading-snug mb-1">
                                    {activity.title}
                                  </h4>
                                  <span className="text-xs text-gray-500 dark:text-gray-600">
                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-300 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                                {activity.description}
                              </p>
                              {activity.username && (
                                <p className="text-xs text-gray-500 dark:text-gray-600 mt-auto">
                                  by @{activity.username}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                    <p className="text-gray-500 dark:text-gray-600">No recent activity</p>
                  </div>
                )}
              </div>

              {/* Pulse indicator */}
              {!isLoading && activities.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-green-400 font-semibold">
                      Live updates every 30 seconds • {activities.length} recent {activities.length === 1 ? 'action' : 'actions'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(168, 85, 247, 0.1);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </section>
  );
}
