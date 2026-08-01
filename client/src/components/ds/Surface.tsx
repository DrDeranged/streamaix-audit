import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SurfaceVariant = "panel" | "raised";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** panel = ink-surface card with ink-edge border; raised = ink-raised for nesting */
  variant?: SurfaceVariant;
}

/**
 * The one card/panel wrapper of the design system (see DESIGN.md).
 * All cards in the app are a Surface.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ variant = "panel", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl",
        variant === "panel" && "border border-ink-edge bg-ink-surface",
        variant === "raised" && "bg-ink-raised",
        className,
      )}
      {...props}
    />
  ),
);
Surface.displayName = "Surface";

export default Surface;
