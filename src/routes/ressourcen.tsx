import { createFileRoute } from '@tanstack/react-router'
import { AppHeader } from '#/components/layout/app-header'
import { ConnectBootScreen } from '#/components/layout/connect-boot-screen'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageMain, PageShell } from '#/components/layout/page-shell'
import { ResourceHubContent } from '#/components/resources/resource-hub-content'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { useSignedInUser } from '#/hooks/use-signed-in-user'
import { APP_NAME } from '#/lib/constants'
import { LOADER_STALE_MS } from '#/lib/deferred-loader'
import { buildResourceHub } from '#/lib/resources/hub'
import { requireActiveSession } from '#/server/get-current-user'

export const Route = createFileRoute('/ressourcen')({
  head: () => ({
    meta: [{ title: `Ressourcen · ${APP_NAME}` }],
  }),
  staleTime: LOADER_STALE_MS,
  gcTime: 5 * 60_000,
  loader: async () => {
    await requireActiveSession()
  },
  pendingMs: 0,
  pendingMinMs: 400,
  pendingComponent: ConnectBootScreen,
  component: RessourcenPage,
})

function RessourcenPage() {
  const { user, error, retry } = useSignedInUser()

  if (!user) {
    return <ConnectBootScreen error={error} onRetry={retry} />
  }

  const groups = buildResourceHub(user.allGroups)

  return (
    <PageShell>
      <AppHeader isSignedIn showDashboardLink />

      <PageMain>
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

        <TerminalPanel title="Dienste">
          <ResourceHubContent groups={groups} />
        </TerminalPanel>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}
