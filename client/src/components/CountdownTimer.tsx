import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';
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
        <CheckCircle className="h-3 w-3 text-gain" />
        <Badge className="bg-gain/10 text-gain border-gain/30 text-xs rounded-xl">
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
          <Clock className="h-3 w-3 text-accent-bright" />
          <span className="text-accent-bright font-mono tabular">
            {timeRemaining.days}d {timeRemaining.hours}h
          </span>
        </div>
      );
    } else if (timeRemaining.hours > 0) {
      return (
        <div className={cn("flex items-center gap-1 text-xs", className)}>
          <Clock className="h-3 w-3 text-warn" />
          <span className="text-warn font-mono tabular">
            {timeRemaining.hours}h {timeRemaining.minutes}m
          </span>
        </div>
      );
    } else {
      return (
        <div className={cn("flex items-center gap-1 text-xs", className)}>
          <Clock className="h-3 w-3 text-loss animate-pulse" />
          <span className="text-loss font-mono tabular">
            {timeRemaining.minutes}m {timeRemaining.seconds}s
          </span>
        </div>
      );
    }
  }

  // Full countdown display
  const getUrgencyColor = () => {
    if (timeRemaining.days <= 1) return 'text-loss';
    if (timeRemaining.days <= 7) return 'text-warn';
    return 'text-accent-bright';
  };

  const getUrgencyBg = () => {
    if (timeRemaining.days <= 1) return 'bg-loss/10 border-loss/30';
    if (timeRemaining.days <= 7) return 'bg-warn/10 border-warn/30';
    return 'bg-accent-core/10 border-accent-core/30';
  };

  return (
    <Surface className={cn("space-y-2 p-3", className)}>
      <div className="flex items-center gap-2">
        <Clock className={cn("h-4 w-4", getUrgencyColor())} />
        <span className="text-body text-sm font-medium">Time Remaining:</span>
      </div>
      
      <div className={cn("inline-flex items-center gap-1 px-3 py-2 rounded-xl border", getUrgencyBg())}>
        <div className="grid grid-cols-4 gap-3 text-center">
          {timeRemaining.days > 0 && (
            <div className="text-center">
                <div className={cn("text-lg font-bold font-mono tabular", getUrgencyColor())}>
                {timeRemaining.days}
              </div>
              <div className="text-xs text-muted">day{timeRemaining.days !== 1 ? 's' : ''}</div>
            </div>
          )}
          
          <div className="text-center">
            <div className={cn("text-lg font-bold font-mono tabular", getUrgencyColor())}>
              {timeRemaining.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted">hrs</div>
          </div>
          
          <div className="text-center">
            <div className={cn("text-lg font-bold font-mono tabular", getUrgencyColor())}>
              {timeRemaining.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted">min</div>
          </div>
          
          <div className="text-center">
            <div className={cn("text-lg font-bold font-mono tabular", getUrgencyColor())}>
              {timeRemaining.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted">sec</div>
          </div>
        </div>
      </div>
      
      {/* Urgency indicator */}
      {timeRemaining.days <= 1 && (
        <div className="flex items-center gap-1 text-xs text-loss">
          <span className="animate-pulse">🚨</span>
          <span>High Urgency - Event Tomorrow or Today</span>
        </div>
      )}
      {timeRemaining.days <= 7 && timeRemaining.days > 1 && (
        <div className="flex items-center gap-1 text-xs text-warn">
          <span>⚡</span>
          <span>Medium Urgency - Event This Week</span>
        </div>
      )}
    </Surface>
  );
}

export default CountdownTimer;