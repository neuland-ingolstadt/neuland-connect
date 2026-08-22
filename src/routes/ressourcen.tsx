import { createFileRoute, defer, redirect } from '@tanstack/react-router'
import { DeferredValue } from '#/components/deferred-value'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { ResourceHubContent } from '#/components/resources/resource-hub-content'
import { Skeleton } from '#/components/ui/skeleton'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { APP_NAME, ROUTES } from '#/lib/constants'
import { LOADER_STALE_MS } from '#/lib/deferred-loader'
import { buildResourceHub } from '#/lib/resources/hub'
import { getCurrentUserFn } from '#/server/get-current-user'

export const Route = createFileRoute('/ressourcen')({
  head: () => ({
    meta: [{ title: `Ressourcen · ${APP_NAME}` }],
  }),
  staleTime: LOADER_STALE_MS,
  gcTime: 5 * 60_000,
  loader: () => {
    const groupsPromise = getCurrentUserFn().then(user => {
      if (!user) {
        throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
      }

      return buildResourceHub(user.allGroups)
    })

    return { groups: defer(groupsPromise) }
  },
  component: RessourcenPage,
})

function ResourceHubSkeleton() {
  return (
    <TerminalPanel title="Dienste">
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </TerminalPanel>
  )
}

function RessourcenPage() {
  const { groups } = Route.useLoaderData()

  return (
    <PageShell>
      <AppHeader isSignedIn showDashboardLink />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
            Portal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Ressourcen-Hub
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-terminal-text/60">
            Schnellzugriff auf die wichtigsten Neuland-Dienste, basierend auf
            deinen Berechtigungen.
          </p>
        </header>

        <DeferredValue value={groups} fallback={<ResourceHubSkeleton />}>
          {resolvedGroups => (
            <TerminalPanel title="Dienste">
              <ResourceHubContent groups={resolvedGroups} />
            </TerminalPanel>
          )}
        </DeferredValue>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
