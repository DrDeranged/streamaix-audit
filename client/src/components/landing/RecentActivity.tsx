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
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";

export function RecentActivity() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: activityData, isLoading } = useQuery<{ activities: any[] }>({
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
    <section className="pt-12 pb-20 relative overflow-hidden bg-transparent">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="relative group">
            {/* Main card */}
            <Surface className="relative overflow-hidden">
              {/* Header */}
              <div className="border-b border-ink-divider p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-accent-core/30 bg-accent-core/10 p-2.5">
                      <Activity className="h-6 w-6 text-accent-bright" />
                    </div>
                    <div>
                      <SectionTitle as="h3">Recent Actions</SectionTitle>
                      <p className="text-sm text-secondary">Latest activity across all features</p>
                    </div>
                  </div>
                  
                  {/* Navigation arrows */}
                  {!isLoading && activities.length > 2 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => scroll('left')}
                        className="rounded-xl border border-accent-core/30 bg-accent-core/10 p-2 transition-all duration-300 hover:border-accent-core/50 hover:bg-ink-raised group/btn"
                        data-testid="scroll-left-button"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="h-5 w-5 text-accent-bright group-hover/btn:text-primary" />
                      </button>
                      <button
                        onClick={() => scroll('right')}
                        className="rounded-xl border border-accent-core/30 bg-accent-core/10 p-2 transition-all duration-300 hover:border-accent-core/50 hover:bg-ink-raised group/btn"
                        data-testid="scroll-right-button"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="h-5 w-5 text-accent-bright group-hover/btn:text-primary" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Horizontal Scroll Container */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-bright" />
                    <span className="ml-3 text-secondary">Loading activity...</span>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="relative">
                    <div
                      ref={scrollContainerRef}
                      className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#7C5CFF #232B5C'
                      }}
                      data-testid="activity-scroll-container"
                    >
                      {activities.map((activity: any, index: number) => {
                        const Icon = activity.type === 'user' ? UserPlus :
                                     activity.type === 'summary' ? FileText :
                                     activity.type === 'bounty' ? Target :
                                     activity.type === 'market' ? TrendingUp : Activity;
                        
                         const iconColor = activity.type === 'user' ? 'text-accent-bright bg-accent-core/10 border-accent-core/20' :
                                          activity.type === 'summary' ? 'text-accent-bright bg-accent-core/10 border-accent-core/20' :
                                          activity.type === 'bounty' ? 'text-warn bg-warn/10 border-warn/20' :
                                          'text-gain bg-gain/10 border-gain/20';

                        return (
                          <motion.div
                            key={`${activity.type}-${activity.id}-${index}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex-shrink-0 w-80 rounded-xl border border-ink-edge bg-ink-raised p-4 transition-all duration-300 hover:border-accent-core/50 hover:bg-ink-surface"
                            data-testid={`activity-item-${index}`}
                          >
                            <div className="flex flex-col h-full">
                              <div className="flex items-start gap-3 mb-3">
                                 <div className={`flex-shrink-0 rounded-xl p-2.5 ${iconColor} transition-transform duration-300 group-hover:scale-110`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <h4 className="mb-1 text-sm font-semibold leading-snug text-primary">
                                    {activity.title}
                                  </h4>
                                   <span className="text-xs text-muted">
                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                               <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-body">
                                {activity.description}
                              </p>
                              {activity.username && (
                                 <p className="mt-auto text-xs text-muted">
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
                     <Activity className="mx-auto mb-3 h-12 w-12 text-muted opacity-50" />
                     <p className="text-muted">No recent activity</p>
                  </div>
                )}
              </div>

              {/* Pulse indicator */}
              {!isLoading && activities.length > 0 && (
                <div className="px-6 pb-6">
                   <div className="flex items-center justify-center gap-2 rounded-xl border border-gain/20 bg-gain/10 py-3">
                     <div className="h-2 w-2 animate-pulse rounded-full bg-gain" />
                     <span className="text-sm font-semibold text-gain">
                      Live updates every 30 seconds • {activities.length} recent {activities.length === 1 ? 'action' : 'actions'}
                    </span>
                  </div>
                </div>
              )}
            </Surface>
          </div>
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
           background: #232B5C;
           border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
           background: #7C5CFF;
           border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
           background: #9F7FFF;
        }
      `}</style>
    </section>
  );
}
