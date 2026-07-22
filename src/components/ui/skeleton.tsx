import type * as React from 'react'
import { cn } from '#/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-terminal-window-border', className)}
      {...props}
    />
  )
}

export { Skeleton }
