import { createFileRoute } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageMain, PageShell } from '#/components/layout/page-shell'
import { MemberIdScanner } from '#/components/scanner/member-id-scanner'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { APP_NAME, ROUTES } from '#/lib/constants'
import { useI18n } from '#/lib/i18n/locale-context'
import { type CurrentUser, getCurrentUserFn } from '#/server/get-current-user'

export const Route = createFileRoute('/scanner')({
  head: () => ({
    meta: [{ title: `Scanner · ${APP_NAME}` }],
  }),
  // No session requirement — public page, only shared via direct link.
  // Security: the page exposes no private data; verification runs locally
  // in the browser against a public key. All other routes keep their gates.
  component: ScannerRoute,
})

function ScannerRoute() {
  // Optional: personalize the header when a member is signed in.
  // Never redirects — the scanner stays usable without login.
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const next = await getCurrentUserFn()
        if (!cancelled) {
          setUser(next)
        }
      } catch {
        // Logged out — scanner stays usable.
      } finally {
        if (!cancelled) {
          setSessionChecked(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const signedIn = user !== null
  const { t } = useI18n()

  return (
    <PageShell>
      <AppHeader isSignedIn={signedIn} showDashboardLink={signedIn} />

      <PageMain>
        <header className="mb-6 max-w-2xl">
          <p className="eyebrow">{t('scanner.eyebrow')}</p>
          <h1 className="page-title mt-2">{t('scanner.title')}</h1>
          <p className="page-lead mt-2">{t('scanner.lead')}</p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <MemberIdScanner />
          </div>

          {sessionChecked && !signedIn ? (
            <div className="min-w-0">
              <TerminalPanel title={t('scanner.teaserTitle')}>
                <div className="space-y-4 p-4 sm:p-5">
                  <p className="text-sm leading-relaxed text-terminal-text/60">
                    {t('scanner.teaserText')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a href={ROUTES.LOGIN}>
                      <LogIn />
                      {t('scanner.teaserCta')}
                    </a>
                  </Button>
                </div>
              </TerminalPanel>
            </div>
          ) : null}
        </div>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}
