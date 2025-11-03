import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ConfidenceRingProps {
  confidence: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

export function ConfidenceRing({
  confidence,
  size = 80,
  strokeWidth = 6,
  showPercentage = true,
  className = "",
}: ConfidenceRingProps) {
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedConfidence(confidence);
    }, 100);
    return () => clearTimeout(timer);
  }, [confidence]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedConfidence / 100) * circumference;

  // Color based on confidence level
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "hsl(var(--chart-2))"; // Emerald
    if (conf >= 70) return "hsl(var(--chart-4))"; // Cyan
    return "hsl(var(--chart-5))"; // Amber
  };

  const color = getConfidenceColor(confidence);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        
        {/* Animated progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="drop-shadow-lg"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <span className="text-sm font-bold" style={{ color }}>
            {Math.round(confidence)}%
          </span>
        </motion.div>
      )}
    </div>
  );
}
