import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  timestamp: number;
}

interface StreamReactionsProps {
  streamId: string;
  onReact?: (emoji: string) => void;
  incomingReactions?: { emoji: string; userId: string }[];
}

const REACTION_EMOJIS = ['🔥', '💎', '🚀', '👀', '💰', '📈', '❤️', '👏', '🎯', '⚡'];

function FloatingReaction({ reaction, onComplete }: { reaction: Reaction; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ 
        y: -150, 
        opacity: 0, 
        scale: 1,
        x: reaction.x > 50 ? 20 : -20,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3, ease: 'easeOut' }}
      className="absolute bottom-0 text-3xl sm:text-4xl pointer-events-none z-30"
      style={{ left: `${reaction.x}%` }}
    >
      {reaction.emoji}
    </motion.div>
  );
}

export function StreamReactions({ streamId, onReact, incomingReactions }: StreamReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (incomingReactions && incomingReactions.length > 0) {
      const latest = incomingReactions[incomingReactions.length - 1];
      addReaction(latest.emoji);
    }
  }, [incomingReactions]);

  const addReaction = (emoji: string) => {
    const newReaction: Reaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: 10 + Math.random() * 80,
      timestamp: Date.now(),
    };
    setReactions(prev => [...prev, newReaction]);
  };

  const handleReact = (emoji: string) => {
    addReaction(emoji);
    onReact?.(emoji);
    setShowPicker(false);
  };

  const removeReaction = (id: string) => {
    setReactions(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="absolute bottom-16 left-0 right-0 h-40 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {reactions.map(reaction => (
            <FloatingReaction
              key={reaction.id}
              reaction={reaction}
              onComplete={() => removeReaction(reaction.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPicker(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-ink-raised/90 backdrop-blur-sm border border-ink-edge text-primary text-sm"
          data-testid="button-show-reactions"
        >
          <span>🔥</span>
          <span className="text-muted">React</span>
        </motion.button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-2 left-0 bg-ink-surface backdrop-blur-xl rounded-2xl border border-ink-edge p-2 shadow-xl"
            >
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {REACTION_EMOJIS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReact(emoji)}
                    className="p-2 text-2xl hover:bg-ink-raised rounded-xl transition-colors"
                    data-testid={`reaction-${emoji}`}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface QuickReactButtonsProps {
  onReact: (emoji: string) => void;
}

export function QuickReactButtons({ onReact }: QuickReactButtonsProps) {
  const quickEmojis = ['🔥', '💎', '🚀', '❤️'];
  
  return (
    <div className="flex gap-1.5">
      {quickEmojis.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReact(emoji)}
          className="p-2 text-xl bg-ink-raised hover:bg-ink-surface rounded-xl border border-ink-edge transition-colors"
          data-testid={`quick-react-${emoji}`}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
