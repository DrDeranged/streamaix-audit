import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Optional eyebrow line rendered above the title — rendered with cyan→violet gradient */
  eyebrow?: ReactNode;
  /** Heading level, defaults to h2 */
  as?: "h1" | "h2" | "h3";
}

/**
 * Section heading of the design system: editorial serif display type with an
 * optional eyebrow (see DESIGN.md).
 *
 * Neon Signal: titles render white→lavender gradient (text-grad-title);
 * eyebrows render cyan→violet gradient (text-grad-eyebrow). Both utilities
 * are defined in index.css and are universal primitives — no per-page work.
 */
export function SectionTitle({
  eyebrow,
  as: Tag = "h2",
  className,
  children,
  ...props
}: SectionTitleProps) {
  return (
    <div className="min-w-0">
      {eyebrow && (
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-grad-eyebrow">
          {eyebrow}
        </div>
      )}
      <Tag
        className={cn(
          "font-display text-grad-title",
          Tag === "h1" && "text-2xl leading-tight sm:text-3xl lg:text-4xl",
          Tag === "h2" && "text-lg sm:text-xl",
          Tag === "h3" && "text-base sm:text-lg",
          className,
        )}
        {...props}
      >
        {children}
      </Tag>
    </div>
  );
}

export default SectionTitle;
