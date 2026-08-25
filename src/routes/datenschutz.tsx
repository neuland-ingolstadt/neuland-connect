import { createFileRoute, defer } from '@tanstack/react-router'
import { DeferredValue } from '#/components/deferred-value'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageMain, PageShell } from '#/components/layout/page-shell'
import { DatenschutzContent } from '#/components/legal/datenschutz-content'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { APP_NAME } from '#/lib/constants'
import { hasActiveSessionFn } from '#/server/get-current-user'

export const Route = createFileRoute('/datenschutz')({
  head: () => ({
    meta: [{ title: `Datenschutz · ${APP_NAME}` }],
  }),
  loader: () => defer(hasActiveSessionFn()),
  component: DatenschutzPage,
})

function DatenschutzPage() {
  const isSignedIn = Route.useLoaderData()

  return (
    <PageShell>
      <DeferredValue
        value={isSignedIn}
        fallback={<AppHeader isSignedIn={false} />}
      >
        {signedIn => <AppHeader isSignedIn={signedIn} />}
      </DeferredValue>

      <PageMain>
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
            Rechtliches
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Datenschutzerklärung
          </h1>
        </header>

        <TerminalPanel title="Neuland Connect">
          <DatenschutzContent />
        </TerminalPanel>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}
