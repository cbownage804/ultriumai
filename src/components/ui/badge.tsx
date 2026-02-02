import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border/50 hover:bg-accent/50",
        success: "border-transparent bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
        warning: "border-transparent bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
        info: "border-transparent bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30",
        premium: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
        glow: "border-primary/30 bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)] hover:shadow-[0_0_15px_rgba(var(--primary),0.5)]",
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
