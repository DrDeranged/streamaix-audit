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
      return <span className="text-white">{title}</span>;
    }
    
    const parts = title.split(highlightWord);
    return (
      <>
        <span className="text-white">{parts[0]}</span>
        <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {highlightWord}
        </span>
        {parts[1] && <span className="text-white">{parts[1]}</span>}
      </>
    );
  };

  return (
    <div className={cn(
      "space-y-2 mb-6",
      align === "center" ? "text-center" : "text-left",
      className
    )}>
      {badge && (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
          "bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium",
          align === "center" ? "mx-auto" : ""
        )}>
          {badgeIcon}
          {badge}
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
        {renderTitle()}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-400 max-w-lg mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
