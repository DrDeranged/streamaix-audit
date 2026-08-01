import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LedgerRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Left column: label / ticker / name */
  label: ReactNode;
  /** Middle column: right-aligned tabular value (e.g. price) */
  value?: ReactNode;
  /** Numeric delta rendered signed, toFixed(2), gain/loss colored, fixed width */
  delta?: number;
  /** Optional suffix for the delta, defaults to "%" */
  deltaSuffix?: string;
  /** Render a bottom ink-divider border (on by default) */
  divider?: boolean;
}

/**
 * The three-column ledger pattern from the newsletter (see DESIGN.md):
 * label left / value right-aligned tabular / delta right-aligned fixed-width.
 */
export function LedgerRow({
  label,
  value,
  delta,
  deltaSuffix = "%",
  divider = true,
  className,
  ...props
}: LedgerRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2",
        divider && "border-b border-ink-divider last:border-b-0",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1 truncate text-sm text-body">{label}</div>
      {value !== undefined && (
        <div className="tabular whitespace-nowrap text-right text-xs text-secondary">
          {value}
        </div>
      )}
      {typeof delta === "number" && Number.isFinite(delta) && (
        <div
          className={cn(
            "tabular w-[62px] shrink-0 text-right text-xs font-medium",
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

export default LedgerRow;
