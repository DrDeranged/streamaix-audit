import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: string;
  isCompleted?: boolean;
  compact?: boolean;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({ targetDate, isCompleted = false, compact = false, className }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  const calculateTimeRemaining = (targetDate: string): TimeRemaining => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: difference };
  };

  useEffect(() => {
    if (isCompleted) return;

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(targetDate));
    };

    // Initial calculation
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate, isCompleted]);

  // Event has passed or is completed
  if (isCompleted || timeRemaining.total <= 0) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <CheckCircle className="h-3 w-3 text-green-400" />
        <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
          Completed
        </Badge>
      </div>
    );
  }

  // Compact version for list items
  if (compact) {
    if (timeRemaining.days > 0) {
      return (
        <div className={cn("flex items-center gap-1 text-xs", className)}>
          <Clock className="h-3 w-3 text-cyan-400" />
          <span className="text-cyan-400 font-mono">
            {timeRemaining.days}d {timeRemaining.hours}h
          </span>
        </div>
      );
    } else if (timeRemaining.hours > 0) {
      return (
        <div className={cn("flex items-center gap-1 text-xs", className)}>
          <Clock className="h-3 w-3 text-orange-400" />
          <span className="text-orange-400 font-mono">
            {timeRemaining.hours}h {timeRemaining.minutes}m
          </span>
        </div>
      );
    } else {
      return (
        <div className={cn("flex items-center gap-1 text-xs", className)}>
          <Clock className="h-3 w-3 text-red-400 animate-pulse" />
          <span className="text-red-400 font-mono">
            {timeRemaining.minutes}m {timeRemaining.seconds}s
          </span>
        </div>
      );
    }
  }

  // Full countdown display
  const getUrgencyColor = () => {
    if (timeRemaining.days <= 1) return 'text-red-400';
    if (timeRemaining.days <= 7) return 'text-orange-400';
    return 'text-cyan-400';
  };

  const getUrgencyBg = () => {
    if (timeRemaining.days <= 1) return 'bg-red-500/20 border-red-400/30';
    if (timeRemaining.days <= 7) return 'bg-orange-500/20 border-orange-400/30';
    return 'bg-cyan-500/20 border-cyan-400/30';
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Clock className={cn("h-4 w-4", getUrgencyColor())} />
        <span className="text-gray-300 text-sm font-medium">Time Remaining:</span>
      </div>
      
      <div className={cn("inline-flex items-center gap-1 px-3 py-2 rounded-lg border", getUrgencyBg())}>
        <div className="grid grid-cols-4 gap-3 text-center">
          {timeRemaining.days > 0 && (
            <div className="text-center">
              <div className={cn("text-lg font-bold font-mono", getUrgencyColor())}>
                {timeRemaining.days}
              </div>
              <div className="text-xs text-gray-400">day{timeRemaining.days !== 1 ? 's' : ''}</div>
            </div>
          )}
          
          <div className="text-center">
            <div className={cn("text-lg font-bold font-mono", getUrgencyColor())}>
              {timeRemaining.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400">hrs</div>
          </div>
          
          <div className="text-center">
            <div className={cn("text-lg font-bold font-mono", getUrgencyColor())}>
              {timeRemaining.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400">min</div>
          </div>
          
          <div className="text-center">
            <div className={cn("text-lg font-bold font-mono", getUrgencyColor())}>
              {timeRemaining.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400">sec</div>
          </div>
        </div>
      </div>
      
      {/* Urgency indicator */}
      {timeRemaining.days <= 1 && (
        <div className="flex items-center gap-1 text-xs text-red-400">
          <span className="animate-pulse">🚨</span>
          <span>High Urgency - Event Tomorrow or Today</span>
        </div>
      )}
      {timeRemaining.days <= 7 && timeRemaining.days > 1 && (
        <div className="flex items-center gap-1 text-xs text-orange-400">
          <span>⚡</span>
          <span>Medium Urgency - Event This Week</span>
        </div>
      )}
    </div>
  );
}

export default CountdownTimer;