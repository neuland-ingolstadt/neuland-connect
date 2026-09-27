import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type TerminalPanelProps = {
  children: ReactNode
  className?: string
  id?: string
  title?: string
  subtitle?: string
  titleAside?: ReactNode
  showCorners?: boolean
}

function TerminalCorners() {
  return (
    <>
      <span className="terminal-corner terminal-corner--tl" aria-hidden />
      <span className="terminal-corner terminal-corner--tr" aria-hidden />
      <span className="terminal-corner terminal-corner--bl" aria-hidden />
      <span className="terminal-corner terminal-corner--br" aria-hidden />
    </>
  )
}

export function TerminalPanel({
  children,
  className,
  id,
  title,
  subtitle,
  titleAside,
  showCorners = false,
}: TerminalPanelProps) {
  return (
    <div
      id={id}
      className={cn(
        'group relative min-w-0 max-w-full overflow-hidden border border-terminal-window-border bg-terminal-window',
        'shadow-[0_1px_0_var(--terminal-window-border),0_16px_36px_-28px_color-mix(in_oklab,var(--terminal-text)_25%,transparent)]',
        className,
      )}
    >
      {showCorners ? <TerminalCorners /> : null}

      {title ? (
        <div className="relative z-10 border-b border-terminal-window-border/50 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-tight text-terminal-text">
              {title}
            </p>
            {titleAside}
          </div>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-terminal-text/55">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
