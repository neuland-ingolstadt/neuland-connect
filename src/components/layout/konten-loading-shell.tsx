import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageMain, PageShell } from '#/components/layout/page-shell'
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

export function KontenLoadingShell() {
  return (
    <PageShell>
      <AppHeader isSignedIn />

      <PageMain>
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
            Konten
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Konten verknüpfen
          </h1>
        </header>

        <div className="min-w-0 space-y-5">
          <Skeleton className="h-14 w-full" />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="min-w-0 space-y-5 lg:col-span-2">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="min-w-0">
              <CardSkeleton />
            </div>
          </div>
        </div>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}
