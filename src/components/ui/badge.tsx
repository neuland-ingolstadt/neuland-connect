import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '#/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-terminal-cyan/30 bg-terminal-cyan/15 text-terminal-cyan',
        secondary:
          'border-terminal-window-border bg-terminal-card text-terminal-text/80',
        destructive:
          'border-destructive/40 bg-destructive/15 text-destructive-foreground',
        outline: 'border-terminal-window-border text-terminal-text',
        success:
          'border-terminal-cyan/40 bg-terminal-cyan/10 text-terminal-lightGreen',
        muted:
          'border-terminal-window-border bg-terminal-window text-terminal-text/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
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
