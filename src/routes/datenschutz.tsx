import { createFileRoute } from '@tanstack/react-router'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { DatenschutzContent } from '#/components/legal/datenschutz-content'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { APP_NAME } from '#/lib/constants'
import { hasActiveSessionFn } from '#/server/get-current-user'

export const Route = createFileRoute('/datenschutz')({
  head: () => ({
    meta: [{ title: `Datenschutz · ${APP_NAME}` }],
  }),
  pendingMs: Number.POSITIVE_INFINITY,
  loader: () => hasActiveSessionFn(),
  component: DatenschutzPage,
})

function DatenschutzPage() {
  const isSignedIn = Route.useLoaderData()

  return (
    <PageShell>
      <AppHeader isSignedIn={isSignedIn} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
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
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
