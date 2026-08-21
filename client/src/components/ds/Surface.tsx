import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SurfaceVariant = "panel" | "raised";
export type DomainGlow = "cyan" | "vio" | "mag" | "warn";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** panel = ink-surface card with ink-edge border; raised = ink-raised for nesting */
  variant?: SurfaceVariant;
  /**
   * Optional domain accent for the Neon Signal glow system.
   * Sets `data-domain` on the element; CSS in index.css applies the matching
   * border-color + box-shadow automatically — no per-page class needed.
   *
   * "cyan"  → signals / analytics
   * "vio"   → AI / intelligence
   * "mag"   → social / live
   * "warn"  → risk / caution
   */
  domain?: DomainGlow;
}

/**
 * The one card/panel wrapper of the design system (see DESIGN.md).
 * All cards in the app are a Surface.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ variant = "panel", domain, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl",
        variant === "panel" && "border border-ink-edge bg-ink-surface",
        variant === "raised" && "bg-ink-raised",
        className,
      )}
      data-domain={domain}
      {...props}
    />
  ),
);
Surface.displayName = "Surface";

export default Surface;
