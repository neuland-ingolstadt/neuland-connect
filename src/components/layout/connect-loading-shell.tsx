import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { Skeleton } from '#/components/ui/skeleton'
import { TerminalPanel } from '#/components/ui/terminal-panel'

function CardSkeleton() {
  return (
    <TerminalPanel title="…">
      <div className="space-y-4 p-4 sm:p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-32" />
      </div>
    </TerminalPanel>
  )
}

export function ConnectLoadingShell() {
  return (
    <PageShell>
      <AppHeader isSignedIn />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
            Connect
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Konten verknüpfen
          </h1>
        </header>

        <div className="space-y-5">
          <Skeleton className="h-14 w-full" />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton />
          </div>
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
