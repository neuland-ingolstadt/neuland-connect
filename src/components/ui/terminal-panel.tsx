import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type TerminalPanelProps = {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  titleAside?: ReactNode
}

export function TerminalPanel({
  children,
  className,
  title,
  subtitle,
  titleAside,
}: TerminalPanelProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden border border-terminal-window-border bg-terminal-window',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-terminal-cyan/[0.04] via-transparent to-terminal-cyan/[0.06]" />
      </div>

      {title ? (
        <div className="relative z-10 border-b border-terminal-window-border/70 bg-terminal-window-title/80 px-4 py-1.5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-terminal-text/65">
              <span className="text-terminal-cyan/75">//</span> {title}
            </p>
            {titleAside}
          </div>
          {subtitle ? (
            <p className="mt-0.5 font-mono text-[10px] normal-case tracking-normal text-terminal-text/45">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
