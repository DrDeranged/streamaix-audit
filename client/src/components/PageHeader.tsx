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
  default: "border-ink-edge text-primary",
  purple: "border-accent-core/40 text-accent-bright",
  cyan: "border-accent-core/40 text-accent-bright",
  fuchsia: "border-accent-core/40 text-accent-bright",
  amber: "border-warn/40 text-warn",
  emerald: "border-gain/40 text-gain",
  rose: "border-loss/40 text-loss",
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
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-core/35 bg-accent-core/10 text-accent-bright sm:h-11 sm:w-11"
                aria-hidden="true"
              >
                {icon}
              </span>
            )}
            <h1
              className={cn(
                "min-w-0 break-words font-display text-2xl leading-tight text-primary sm:text-3xl lg:text-4xl",
              )}
              data-testid="page-header-title"
            >
              {title}
            </h1>
          </div>
          {subtitle && (
            <p
              className={cn(
                "text-sm text-secondary sm:text-base",
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
                "flex min-w-0 flex-col gap-1 rounded-xl bg-ink-surface px-3 py-2",
                "border",
                toneRing[m.tone ?? "default"],
              )}
              data-testid={m.testId}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                {m.label}
              </div>
              <div className="tabular truncate text-base font-semibold sm:text-lg">
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
