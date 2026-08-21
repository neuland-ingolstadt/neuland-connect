import { createFileRoute } from '@tanstack/react-router'
import { FaqPageContent } from '#/components/faq/faq-page-content'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { APP_NAME } from '#/lib/constants'
import { hasActiveSessionFn } from '#/server/get-current-user'

export const Route = createFileRoute('/faq')({
  head: () => ({
    meta: [{ title: `FAQ · ${APP_NAME}` }],
  }),
  pendingMs: Number.POSITIVE_INFINITY,
  loader: () => hasActiveSessionFn(),
  component: FaqPage,
})

function FaqPage() {
  const isSignedIn = Route.useLoaderData()

  return (
    <PageShell>
      <AppHeader isSignedIn={isSignedIn} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
            Hilfe
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Häufige Fragen
          </h1>
        </header>

        <TerminalPanel title="Fragen">
          <FaqPageContent />
        </TerminalPanel>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
