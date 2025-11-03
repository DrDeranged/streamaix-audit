import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  showSparkle?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  formatValue = (v) => v.toLocaleString(),
  trend,
  trendValue,
  className = "",
  showSparkle = false,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-emerald-500" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-rose-500" />;
      case "neutral":
        return <Minus className="w-3 h-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.span
        className="text-2xl font-bold tabular-nums"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {formatValue(count)}
      </motion.span>
      
      {showSparkle && count === value && (
        <motion.div
          className="absolute"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 1.5],
          }}
          transition={{ duration: 0.6 }}
        >
          ✨
        </motion.div>
      )}
      
      {trend && trendValue && (
        <motion.div
          className="flex items-center gap-1 text-xs"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {getTrendIcon()}
          <span className={
            trend === "up" 
              ? "text-emerald-500" 
              : trend === "down" 
              ? "text-rose-500" 
              : "text-muted-foreground"
          }>
            {trendValue}
          </span>
        </motion.div>
      )}
    </div>
  );
}
