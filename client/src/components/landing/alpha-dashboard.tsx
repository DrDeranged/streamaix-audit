import { motion } from 'framer-motion';
import { AlphaTicker } from './alpha-ticker';
import { StoriesLayout } from './stories-layout';
import { FiguresSidebar } from './figures-sidebar';
import { cn } from '@/lib/utils';

interface AlphaDashboardProps {
  className?: string;
}

export function AlphaDashboard({ className }: AlphaDashboardProps) {
  return (
    <div className={cn("w-full min-h-screen bg-black", className)}>
      {/* Alpha Ticker - Top fixed bar */}
      <AlphaTicker className="fixed top-0 left-0 right-0 z-50" />

      {/* Main dashboard grid */}
      <div className="pt-16"> {/* Offset for fixed ticker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-6"
        >
          {/* Desktop: Grid layout with sidebar */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-full">
            {/* Main content area - Stories */}
            <div className="col-span-8 xl:col-span-9">
              <StoriesLayout 
                maxStories={15}
                className="h-full"
              />
            </div>

            {/* Sidebar - Figures */}
            <div className="col-span-4 xl:col-span-3">
              <div className="sticky top-20"> {/* Sticky positioning below ticker */}
                <FiguresSidebar 
                  maxFigures={8}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* Tablet: Stacked layout */}
          <div className="hidden md:block lg:hidden">
            <div className="grid grid-cols-3 gap-6">
              {/* Stories take 2/3 width */}
              <div className="col-span-2">
                <StoriesLayout 
                  maxStories={12}
                  className="h-full"
                />
              </div>

              {/* Figures take 1/3 width */}
              <div className="col-span-1">
                <FiguresSidebar 
                  maxFigures={6}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* Mobile: Full width stacked layout */}
          <div className="block md:hidden space-y-6">
            {/* Figures first on mobile (key insights) */}
            <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-4">
              <FiguresSidebar 
                maxFigures={4}
                className="h-full"
              />
            </div>

            {/* Stories below */}
            <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-4">
              <StoriesLayout 
                maxStories={8}
                className="h-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-black to-purple-500/5 animate-pulse" 
             style={{ animationDuration: '10s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: `
                 linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
               `,
               backgroundSize: '50px 50px'
             }} />
      </div>
    </div>
  );
}