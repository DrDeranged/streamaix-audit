import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
        outline: "border-border/70 text-foreground",
        success:
          "border-neon-emerald/40 bg-neon-emerald/15 text-neon-emerald shadow-[0_0_10px_-4px_hsl(160_80%_45%/0.5)]",
        warning:
          "border-neon-amber/40 bg-neon-amber/15 text-neon-amber shadow-[0_0_10px_-4px_hsl(43_95%_58%/0.5)]",
        info:
          "border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_10px_-4px_hsl(195_95%_55%/0.5)]",
        gradient:
          "border-transparent bg-gradient-to-r from-neon-purple/30 via-neon-fuchsia/25 to-neon-cyan/30 text-white shadow-[0_0_14px_-4px_hsl(258_84%_62%/0.55)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
