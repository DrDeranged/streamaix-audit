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
 *
 * Neon Signal: when `delta` is provided the value number and delta line both
 * receive a soft text-shadow halo in the semantic color (halo-gain / halo-loss).
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
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const isPositive = hasDelta && delta! >= 0;

  return (
    <div className={cn("min-w-0", className)} {...props}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </div>
      <div
        className={cn(
          "tabular font-display text-xl sm:text-2xl",
          hasDelta
            ? isPositive
              ? "text-gain halo-gain"
              : "text-loss halo-loss"
            : "text-primary",
          valueClassName,
        )}
      >
        {value}
      </div>
      {hasDelta && (
        <div
          className={cn(
            "tabular text-xs font-medium",
            isPositive ? "text-gain halo-gain" : "text-loss halo-loss",
          )}
        >
          {isPositive ? "+" : ""}
          {delta!.toFixed(2)}
          {deltaSuffix}
        </div>
      )}
    </div>
  );
}

export default StatValue;
