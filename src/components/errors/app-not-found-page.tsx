import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { ROUTES } from '#/lib/constants'

export function AppNotFoundPage() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  })

  return (
    <PageShell>
      <AppHeader showDashboardLink={false} />

      <div className="flex flex-1 items-center justify-center p-4">
        <TerminalPanel title="Navigation" className="w-full max-w-md">
          <div className="space-y-6 p-6 text-center">
            <div className="mx-auto flex justify-center">
              <div className="relative">
                <NeulandPalm className="h-14 w-auto text-terminal-cyan/70" />
                <FileQuestion className="absolute -right-1 -bottom-1 h-5 w-5 text-terminal-highlight" />
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-terminal-cyan/70">
                Fehler 404
              </p>
              <h1 className="mt-2 font-mono text-xl font-semibold text-terminal-lightGreen">
                Seite nicht gefunden
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-terminal-text/65">
                Die angeforderte Seite existiert nicht oder wurde verschoben.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button className="w-full sm:w-auto" size="lg" asChild>
                <Link to={ROUTES.HOME}>
                  <ArrowLeft />
                  Zur Startseite
                </Link>
              </Button>

              <Button
                className="w-full sm:w-auto"
                size="lg"
                variant="outline"
                asChild
              >
                <Link to={ROUTES.LOGIN} search={{ error: undefined }}>
                  Zur Anmeldung
                </Link>
              </Button>
            </div>

            {import.meta.env.DEV ? (
              <p className="border border-terminal-window-border bg-terminal-bg/60 px-3 py-2 font-mono text-[11px] text-terminal-text/55">
                {pathname}
              </p>
            ) : null}
          </div>
        </TerminalPanel>
      </div>

      <LegalFooter />
    </PageShell>
  )
}
