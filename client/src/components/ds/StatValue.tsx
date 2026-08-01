import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatValueProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  /** Numeric delta (e.g. percent change). Rendered signed, toFixed(2), gain/loss colored. */
  delta?: number;
  /** Optional suffix for the delta, defaults to "%" */
  deltaSuffix?: string;
  valueClassName?: string;
}

/**
 * The ONE way numbers are displayed (see DESIGN.md).
 * label: muted uppercase micro-label; value: display serif, tabular.
 */
export function StatValue({
  label,
  value,
  delta,
  deltaSuffix = "%",
  className,
  valueClassName,
  ...props
}: StatValueProps) {
  return (
    <div className={cn("min-w-0", className)} {...props}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </div>
      <div
        className={cn(
          "tabular font-display text-xl text-primary sm:text-2xl",
          valueClassName,
        )}
      >
        {value}
      </div>
      {typeof delta === "number" && Number.isFinite(delta) && (
        <div
          className={cn(
            "tabular text-xs font-medium",
            delta >= 0 ? "text-gain" : "text-loss",
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(2)}
          {deltaSuffix}
        </div>
      )}
    </div>
  );
}

export default StatValue;
