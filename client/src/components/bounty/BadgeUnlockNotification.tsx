import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, TrendingUp, Target, Zap, Award, Crown, Medal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';

interface BadgeUnlockNotificationProps {
  badges: string[];
  onClose: () => void;
}

const BADGE_INFO: Record<string, { label: string; icon: any; color: string; description: string }> = {
  first_bounty: { 
    label: 'First Steps', 
    icon: Star, 
    color: 'bg-warn', 
    description: 'Completed your first bounty!' 
  },
  speed_demon: { 
    label: 'Speed Demon', 
    icon: Zap, 
    color: 'bg-loss', 
    description: 'Completed a bounty in under 1 hour!' 
  },
  quality_master: { 
    label: 'Quality Master', 
    icon: Award, 
    color: 'bg-accent-core', 
    description: 'Achieved 95+ quality score!' 
  },
  streak_3: { 
    label: '3-Day Streak', 
    icon: Target, 
    color: 'bg-accent-bright', 
    description: 'Maintained a 3-day completion streak!' 
  },
  streak_7: { 
    label: 'Week Warrior', 
    icon: Target, 
    color: 'bg-accent-core', 
    description: 'Maintained a 7-day completion streak!' 
  },
  streak_30: { 
    label: 'Month Master', 
    icon: Target, 
    color: 'bg-accent-core', 
    description: 'Maintained a 30-day completion streak!' 
  },
  specialist_crypto: { 
    label: 'Crypto Specialist', 
    icon: TrendingUp, 
    color: 'bg-gain', 
    description: 'Completed 3+ crypto bounties!' 
  },
  specialist_tech: { 
    label: 'Tech Specialist', 
    icon: TrendingUp, 
    color: 'bg-accent-bright', 
    description: 'Completed 3+ tech bounties!' 
  },
  specialist_business: { 
    label: 'Business Specialist', 
    icon: TrendingUp, 
    color: 'bg-warn', 
    description: 'Completed 3+ business bounties!' 
  },
  century_club: { 
    label: 'Century Club', 
    icon: Crown, 
    color: 'bg-warn', 
    description: 'Completed 100+ bounties!' 
  },
  consistent_hunter: { 
    label: 'Consistent Hunter', 
    icon: Medal, 
    color: 'bg-accent-core', 
    description: 'Completed 10+ bounties with 85+ quality!' 
  },
};

export default function BadgeUnlockNotification({ badges, onClose }: BadgeUnlockNotificationProps) {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const currentBadge = badges[currentBadgeIndex];
  const badgeInfo = BADGE_INFO[currentBadge];

  useEffect(() => {
    if (currentBadgeIndex < badges.length - 1) {
      const timer = setTimeout(() => {
        setCurrentBadgeIndex(currentBadgeIndex + 1);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentBadgeIndex, badges.length, onClose]);

  if (!badgeInfo) return null;

  const Icon = badgeInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-page/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBadge}
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, rotate: 180, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20,
            duration: 0.6 
          }}
          className="relative"
        >
          <Surface className="relative max-w-md rounded-2xl border border-warn/50 bg-ink-surface p-8 mx-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-2 top-2 rounded-xl text-secondary hover:bg-ink-raised hover:text-primary"
              data-testid="button-close-badge-notification"
            >
              <X className="w-4 h-4" />
            </Button>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 5, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="mb-6"
              >
                <div className={`mx-auto flex h-32 w-32 items-center justify-center rounded-xl ${badgeInfo.color} p-1 shadow-2xl shadow-warn/20`}>
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-ink-raised">
                    <Icon className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <SectionTitle as="h2" className="mb-2 text-3xl font-bold text-warn">
                  Achievement Unlocked!
                </SectionTitle>
                <h3 className="mb-3 font-display text-2xl font-bold text-primary">
                  {badgeInfo.label}
                </h3>
                <p className="mb-6 text-body">
                  {badgeInfo.description}
                </p>

                {badges.length > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {badges.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-xl ${
                          index === currentBadgeIndex 
                            ? 'bg-accent-core' 
                            : 'bg-ink-raised'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Confetti effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    top: '50%', 
                    left: '50%',
                    opacity: 1,
                    scale: 0 
                  }}
                  animate={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: 0,
                    scale: 1
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: "easeOut"
                  }}
                  className={`absolute h-2 w-2 rounded-xl ${
                    i % 3 === 0 
                      ? 'bg-warn' 
                      : i % 3 === 1 
                      ? 'bg-loss' 
                      : 'bg-accent-core'
                  }`}
                />
              ))}
            </div>
          </Surface>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
