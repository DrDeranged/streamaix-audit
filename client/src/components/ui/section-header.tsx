import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  badgeIcon,
  className,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div className={cn(
      "space-y-2 mb-6",
      align === "center" ? "text-center" : "text-left",
      className
    )}>
      {badge && (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
          "bg-cyan-500/5 border border-cyan-500/30 text-cyan-400 text-[10px] font-medium tracking-wider uppercase",
          align === "center" ? "mx-auto" : ""
        )}>
          {badgeIcon}
          {badge}
        </div>
      )}
      <h2 className="neon-title text-xl sm:text-2xl font-medium tracking-tight">
        <span className="neon-text-all">{title}</span>
      </h2>
      {subtitle && (
        <p className="text-xs text-gray-500 max-w-sm mx-auto font-light tracking-wide">
          {subtitle}
        </p>
      )}
      
      <style>{`
        .neon-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        
        .neon-text-all {
          background: linear-gradient(135deg, #ffffff 0%, #06b6d4 40%, #a855f7 70%, #ffffff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.4)) drop-shadow(0 0 12px rgba(168, 85, 247, 0.25));
          animation: neon-pulse 3s ease-in-out infinite;
        }
        
        @keyframes neon-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.4)) drop-shadow(0 0 12px rgba(168, 85, 247, 0.25));
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.6)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.4));
          }
        }
      `}</style>
    </div>
  );
}
