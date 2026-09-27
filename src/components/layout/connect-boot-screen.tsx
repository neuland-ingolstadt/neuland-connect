import { NeulandPalm } from '#/components/brand/neuland-palm'
import { PageShell } from '#/components/layout/page-shell'
import { Button } from '#/components/ui/button'
import { APP_NAME } from '#/lib/constants'
import { useI18n } from '#/lib/i18n/locale-context'
import type { MessageKey } from '#/lib/i18n/messages'

const BOOT_LINES: { prompt: MessageKey; detail: MessageKey }[] = [
  { prompt: 'boot.line.session', detail: 'boot.line.sessionDetail' },
  { prompt: 'boot.line.authentik', detail: 'boot.line.authentikDetail' },
  { prompt: 'boot.line.profile', detail: 'boot.line.profileDetail' },
] as const

type ConnectBootScreenProps = {
  error?: boolean
  onRetry?: () => void
}

export function ConnectBootScreen({
  error = false,
  onRetry,
}: ConnectBootScreenProps) {
  const { t } = useI18n()
  return (
    <PageShell>
      <main
        className="page-gutter flex w-full min-w-0 flex-1 items-center justify-center py-10"
        aria-busy={!error}
        aria-live="polite"
      >
        <div className="relative w-full max-w-md overflow-hidden border border-terminal-window-border bg-terminal-window">
          <span className="connect-boot-corner connect-boot-corner--tl" />
          <span className="connect-boot-corner connect-boot-corner--tr" />
          <span className="connect-boot-corner connect-boot-corner--bl" />
          <span className="connect-boot-corner connect-boot-corner--br" />

          <div className="relative border-b border-terminal-window-border/50 px-4 py-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-terminal-text/65">
              <span className="text-terminal-green/75">//</span>{' '}
              {t('boot.title')}
            </p>
          </div>

          <div className="relative space-y-6 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="connect-boot-palm-wrap">
                <NeulandPalm className="h-16 w-auto text-terminal-text" />
              </div>
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.28em] text-terminal-lightGreen">
                {APP_NAME}
              </p>
              <p className="mt-2 text-sm text-terminal-text/60">
                {error ? t('boot.errorLead') : t('boot.preparing')}
              </p>
            </div>

            {error ? (
              <div className="space-y-4 text-center">
                <p className="font-mono text-[12px] text-terminal-text/55">
                  {t('boot.errorDetail')}
                </p>
                {onRetry ? (
                  <Button variant="outline" type="button" onClick={onRetry}>
                    {t('common.retry')}
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <ol className="space-y-1.5 font-mono text-[12px] leading-relaxed">
                  {BOOT_LINES.map((line, index) => (
                    <li
                      key={line.prompt}
                      className="connect-boot-line flex items-baseline gap-2 text-terminal-text/55"
                      style={{ animationDelay: `${180 + index * 280}ms` }}
                    >
                      <span className="text-terminal-green/80">$</span>
                      <span className="text-terminal-text/40">
                        {t(line.prompt)}
                      </span>
                      <span className="text-terminal-text/25">·</span>
                      <span>{t(line.detail)}</span>
                    </li>
                  ))}
                  <li
                    className="connect-boot-line flex items-center gap-2 pt-1 text-terminal-lightGreen"
                    style={{ animationDelay: '1020ms' }}
                  >
                    <span className="text-terminal-green/80">$</span>
                    <span>{t('boot.waiting')}</span>
                    <span className="connect-boot-cursor" aria-hidden="true" />
                  </li>
                </ol>

                <div className="connect-boot-track" aria-hidden="true">
                  <div className="connect-boot-bar" />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  )
}
