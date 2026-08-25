import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type PageShellProps = {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen w-full min-w-0 flex-col',
        className,
      )}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 neuland-grid-bg neuland-glow" />
      {children}
    </div>
  )
}

type PageMainProps = {
  children: ReactNode
  className?: string
}

export function PageMain({ children, className }: PageMainProps) {
  return (
    <main
      className={cn(
        'page-gutter mx-auto w-full min-w-0 max-w-6xl flex-1 py-6 sm:py-10',
        className,
      )}
    >
      {children}
    </main>
  )
}
