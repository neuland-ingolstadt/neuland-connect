import { BUILD_COMMIT } from '#/lib/build-info'
import { EXTERNAL_LINKS } from '#/lib/constants'
import { cn } from '#/lib/utils'

type LegalFooterProps = {
  className?: string
  onShowIntro?: () => void
}

export function LegalFooter({ className, onShowIntro }: LegalFooterProps) {
  return (
    <footer
      className={cn(
        'border-t border-terminal-window-border/60 py-6 text-center font-mono text-xs text-terminal-text/45',
        className,
      )}
    >
      <nav className="flex flex-wrap items-center justify-center gap-4">
        <a
          href={EXTERNAL_LINKS.IMPRESSUM}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-terminal-cyan"
        >
          Impressum
        </a>
        <span aria-hidden="true" className="text-terminal-window-border">
          |
        </span>
        <a
          href={EXTERNAL_LINKS.DATENSCHUTZ}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-terminal-cyan"
        >
          Datenschutz
        </a>
        <span aria-hidden="true" className="text-terminal-window-border">
          |
        </span>
        <a
          href={EXTERNAL_LINKS.REPOSITORY}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-terminal-cyan"
        >
          GitHub
        </a>
        {onShowIntro ? (
          <>
            <span aria-hidden="true" className="text-terminal-window-border">
              |
            </span>
            <button
              type="button"
              onClick={onShowIntro}
              className="cursor-pointer transition-colors hover:text-terminal-cyan"
            >
              Einführung
            </button>
          </>
        ) : null}
      </nav>
      <p className="mt-3">
        Build:{' '}
        <span className="rounded border border-terminal-window-border/80 px-1.5 py-0.5 font-mono text-terminal-text/60">
          {BUILD_COMMIT}
        </span>
      </p>
      <p className="mt-2">
        Copyright © 2026
        <br />
        by{' '}
        <a
          href={EXTERNAL_LINKS.EGGL_DEV}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-terminal-cyan"
        >
          Robert Eggl
        </a>{' '}
        and{' '}
        <a
          href={EXTERNAL_LINKS.WEBSITE}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-terminal-cyan"
        >
          Neuland Ingolstadt e.V.
        </a>
      </p>
    </footer>
  )
}
