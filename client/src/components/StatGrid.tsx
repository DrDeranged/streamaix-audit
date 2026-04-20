import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface StatGridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 2 | 3 | 4;
}

export function StatGrid({
  cols = 4,
  className,
  children,
  ...props
}: StatGridProps) {
  const colsClass =
    cols === 2
      ? "grid-cols-2 md:grid-cols-2"
      : cols === 3
        ? "grid-cols-2 md:grid-cols-3"
        : "grid-cols-2 md:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        colsClass,
        className,
      )}
      data-testid="stat-grid"
      {...props}
    >
      {children}
    </div>
  );
}

export default StatGrid;
