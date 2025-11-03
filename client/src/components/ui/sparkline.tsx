import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = "hsl(195, 100%, 55%)",
  showArea = true,
  className = "",
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
      preserveAspectRatio="none"
    >
      {showArea && (
        <motion.polygon
          points={areaPoints}
          fill={color}
          fillOpacity="0.2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.circle
        cx={data.length > 0 ? width : 0}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
    </svg>
  );
}

export function generateMockSparklineData(length: number = 20, trend: "up" | "down" | "volatile" = "volatile"): number[] {
  const data: number[] = [];
  let baseValue = 50;
  
  for (let i = 0; i < length; i++) {
    const volatility = Math.random() * 10 - 5;
    const trendAdjustment = 
      trend === "up" ? i * 0.5 :
      trend === "down" ? -i * 0.5 :
      0;
    
    baseValue = Math.max(10, Math.min(90, baseValue + volatility + trendAdjustment));
    data.push(baseValue);
  }
  
  return data;
}
