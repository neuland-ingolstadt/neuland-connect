import { Link } from '@tanstack/react-router'
import { BUILD_COMMIT } from '#/lib/build-info'
import { EXTERNAL_LINKS, ROUTES } from '#/lib/constants'
import { useI18n } from '#/lib/i18n/locale-context'
import { cn } from '#/lib/utils'

type LegalFooterProps = {
  className?: string
}

export function LegalFooter({ className }: LegalFooterProps) {
  const { t } = useI18n()
  return (
    <footer
      className={cn(
        'page-gutter w-full min-w-0 border-t border-terminal-window-border/60 py-6 text-center font-mono text-xs text-terminal-text/45',
        className,
      )}
    >
      <nav className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to={ROUTES.IMPRESSUM}
          className="transition-colors hover:text-terminal-green"
        >
          {t('footer.imprint')}
        </Link>
        <span aria-hidden="true" className="text-terminal-window-border">
          |
        </span>
        <Link
          to={ROUTES.DATENSCHUTZ}
          className="transition-colors hover:text-terminal-green"
        >
          {t('footer.privacy')}
        </Link>
        <span aria-hidden="true" className="text-terminal-window-border">
          |
        </span>
        <a
          href={EXTERNAL_LINKS.REPOSITORY}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-terminal-green"
        >
          GitHub
        </a>
      </nav>
      <p className="mt-3">
        {t('footer.build')}:{' '}
        <span className="rounded border border-terminal-window-border/80 px-1.5 py-0.5 font-mono text-terminal-text/60">
          {BUILD_COMMIT}
        </span>
      </p>
      <p className="mt-2">
        {t('footer.copyright')}
        <br />
        {t('footer.by')}{' '}
        <a
          href={EXTERNAL_LINKS.EGGL_DEV}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-terminal-green"
        >
          Robert Eggl
        </a>{' '}
        {t('footer.and')}{' '}
        <a
          href={EXTERNAL_LINKS.WEBSITE}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-terminal-green"
        >
          Neuland Ingolstadt e.V.
        </a>
      </p>
    </footer>
  )
}
