import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricTone =
  | "default"
  | "purple"
  | "cyan"
  | "fuchsia"
  | "amber"
  | "emerald"
  | "rose";

export interface PageHeaderMetric {
  label: string;
  value: ReactNode;
  tone?: MetricTone;
  testId?: string;
}

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  metrics?: PageHeaderMetric[];
  align?: "start" | "center";
  className?: string;
}

const toneRing: Record<MetricTone, string> = {
  default: "border-slate-300/60 text-slate-900 dark:border-white/10 dark:text-white/90",
  purple: "border-neon-purple/40 text-neon-purple",
  cyan: "border-neon-cyan/40 text-neon-cyan",
  fuchsia: "border-neon-fuchsia/40 text-neon-fuchsia",
  amber: "border-neon-amber/40 text-neon-amber",
  emerald: "border-neon-emerald/40 text-neon-emerald",
  rose: "border-neon-rose/40 text-neon-rose",
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  metrics,
  align = "start",
  className,
}: PageHeaderProps) {
  const isCenter = align === "center";
  return (
    <header
      className={cn(
        "w-full",
        isCenter ? "text-center" : "text-left",
        className,
      )}
      data-testid="page-header"
    >
      <div
        className={cn(
          "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
          isCenter && "md:flex-col md:items-center md:text-center",
        )}
      >
        <div
          className={cn(
            "min-w-0 space-y-2",
            isCenter && "mx-auto max-w-2xl",
          )}
        >
          {eyebrow && (
            <div className="text-overline" data-testid="page-header-eyebrow">
              {eyebrow}
            </div>
          )}
          <div
            className={cn(
              "flex items-center gap-3",
              isCenter && "justify-center",
            )}
          >
            {icon && (
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neon-purple/35 bg-neon-purple/10 text-neon-purple sm:h-11 sm:w-11"
                aria-hidden="true"
              >
                {icon}
              </span>
            )}
            <h1
              className={cn(
                "text-display min-w-0 break-words text-2xl leading-tight sm:text-3xl lg:text-4xl",
                "bg-gradient-to-r bg-clip-text text-transparent",
                "from-slate-900 via-purple-700 to-cyan-700",
                "dark:from-white dark:via-purple-200 dark:to-cyan-200",
              )}
              data-testid="page-header-title"
            >
              {title}
            </h1>
          </div>
          {subtitle && (
            <p
              className={cn(
                "text-sm text-muted-foreground sm:text-base",
                isCenter ? "mx-auto max-w-2xl" : "max-w-3xl",
              )}
              data-testid="page-header-subtitle"
            >
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end",
              isCenter && "md:justify-center",
            )}
            data-testid="page-header-actions"
          >
            {actions}
          </div>
        )}
      </div>

      {metrics && metrics.length > 0 && (
        <div
          className={cn(
            "mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4",
            isCenter && "mx-auto max-w-3xl",
          )}
          data-testid="page-header-metrics"
        >
          {metrics.map((m, i) => (
            <div
              key={`${m.label}-${i}`}
              className={cn(
                "surface-1 flex min-w-0 flex-col gap-1 rounded-lg px-3 py-2",
                "border",
                toneRing[m.tone ?? "default"],
              )}
              data-testid={m.testId}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {m.label}
              </div>
              <div className="numeric truncate text-base font-semibold text-foreground sm:text-lg">
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
