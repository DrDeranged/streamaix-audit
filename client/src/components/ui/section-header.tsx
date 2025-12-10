import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  highlightWord?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  title,
  subtitle,
  highlightWord,
  badge,
  badgeIcon,
  className,
  align = "center",
}: SectionHeaderProps) {
  const renderTitle = () => {
    if (!highlightWord) {
      return <span className="neon-text">{title}</span>;
    }
    
    const parts = title.split(highlightWord);
    return (
      <>
        <span className="text-white">{parts[0]}</span>
        <span className="neon-text-highlight">{highlightWord}</span>
        {parts[1] && <span className="text-white">{parts[1]}</span>}
      </>
    );
  };

  return (
    <div className={cn(
      "space-y-3 mb-6",
      align === "center" ? "text-center" : "text-left",
      className
    )}>
      {badge && (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "bg-cyan-500/5 border border-cyan-500/30 text-cyan-400 text-xs font-medium tracking-wide uppercase",
          align === "center" ? "mx-auto" : ""
        )}>
          {badgeIcon}
          {badge}
        </div>
      )}
      <h2 className="neon-title text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
        {renderTitle()}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-500 max-w-md mx-auto font-light tracking-wide">
          {subtitle}
        </p>
      )}
      
      <style>{`
        .neon-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 500;
          letter-spacing: -0.02em;
        }
        
        .neon-text {
          color: white;
          text-shadow: 
            0 0 10px rgba(6, 182, 212, 0.3),
            0 0 20px rgba(6, 182, 212, 0.2),
            0 0 40px rgba(6, 182, 212, 0.1);
        }
        
        .neon-text-highlight {
          background: linear-gradient(135deg, #06b6d4 0%, #a855f7 50%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)) drop-shadow(0 0 16px rgba(168, 85, 247, 0.3));
          animation: neon-pulse 3s ease-in-out infinite;
        }
        
        @keyframes neon-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)) drop-shadow(0 0 16px rgba(168, 85, 247, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(6, 182, 212, 0.6)) drop-shadow(0 0 24px rgba(168, 85, 247, 0.5));
          }
        }
      `}</style>
    </div>
  );
}
