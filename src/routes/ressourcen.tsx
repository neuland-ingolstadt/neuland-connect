import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { ResourceHubContent } from '#/components/resources/resource-hub-content'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { APP_NAME, ROUTES } from '#/lib/constants'
import { buildResourceHub } from '#/lib/resources/hub'
import { getCurrentUserFn } from '#/server/get-current-user'

export const Route = createFileRoute('/ressourcen')({
  head: () => ({
    meta: [{ title: `Ressourcen · ${APP_NAME}` }],
  }),
  pendingMs: Number.POSITIVE_INFINITY,
  loader: async () => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
    }

    return { groups: buildResourceHub(user.allGroups) }
  },
  component: RessourcenPage,
})

function RessourcenPage() {
  const { groups } = Route.useLoaderData()

  return (
    <PageShell>
      <AppHeader isSignedIn showDashboardLink />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
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
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
