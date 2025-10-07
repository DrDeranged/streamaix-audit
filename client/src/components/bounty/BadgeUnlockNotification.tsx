import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, TrendingUp, Target, Zap, Award, Crown, Medal, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BadgeUnlockNotificationProps {
  badges: string[];
  onClose: () => void;
}

const BADGE_INFO: Record<string, { label: string; icon: any; color: string; description: string }> = {
  first_bounty: { 
    label: 'First Steps', 
    icon: Star, 
    color: 'from-yellow-400 to-orange-400', 
    description: 'Completed your first bounty!' 
  },
  speed_demon: { 
    label: 'Speed Demon', 
    icon: Zap, 
    color: 'from-orange-400 to-red-400', 
    description: 'Completed a bounty in under 1 hour!' 
  },
  quality_master: { 
    label: 'Quality Master', 
    icon: Award, 
    color: 'from-purple-400 to-pink-400', 
    description: 'Achieved 95+ quality score!' 
  },
  streak_3: { 
    label: '3-Day Streak', 
    icon: Target, 
    color: 'from-cyan-400 to-blue-400', 
    description: 'Maintained a 3-day completion streak!' 
  },
  streak_7: { 
    label: 'Week Warrior', 
    icon: Target, 
    color: 'from-blue-400 to-purple-400', 
    description: 'Maintained a 7-day completion streak!' 
  },
  streak_30: { 
    label: 'Month Master', 
    icon: Target, 
    color: 'from-purple-400 to-pink-400', 
    description: 'Maintained a 30-day completion streak!' 
  },
  specialist_crypto: { 
    label: 'Crypto Specialist', 
    icon: TrendingUp, 
    color: 'from-green-400 to-emerald-400', 
    description: 'Completed 3+ crypto bounties!' 
  },
  specialist_tech: { 
    label: 'Tech Specialist', 
    icon: TrendingUp, 
    color: 'from-blue-400 to-cyan-400', 
    description: 'Completed 3+ tech bounties!' 
  },
  specialist_business: { 
    label: 'Business Specialist', 
    icon: TrendingUp, 
    color: 'from-orange-400 to-yellow-400', 
    description: 'Completed 3+ business bounties!' 
  },
  century_club: { 
    label: 'Century Club', 
    icon: Crown, 
    color: 'from-yellow-400 to-orange-500', 
    description: 'Completed 100+ bounties!' 
  },
  consistent_hunter: { 
    label: 'Consistent Hunter', 
    icon: Medal, 
    color: 'from-pink-400 to-purple-400', 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
          <Card className="bg-gradient-to-br from-slate-900 to-purple-900/50 border-2 border-yellow-400/50 p-8 max-w-md mx-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
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
                <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${badgeInfo.color} p-1 shadow-2xl shadow-yellow-400/50`}>
                  <div className="w-full h-full rounded-full bg-slate-900/90 flex items-center justify-center">
                    <Icon className="w-16 h-16 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
                  Achievement Unlocked!
                </h2>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {badgeInfo.label}
                </h3>
                <p className="text-gray-300 mb-6">
                  {badgeInfo.description}
                </p>

                {badges.length > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {badges.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentBadgeIndex 
                            ? 'bg-yellow-400' 
                            : 'bg-gray-600'
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
                  className={`absolute w-2 h-2 rounded-full ${
                    i % 3 === 0 
                      ? 'bg-yellow-400' 
                      : i % 3 === 1 
                      ? 'bg-orange-400' 
                      : 'bg-purple-400'
                  }`}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
