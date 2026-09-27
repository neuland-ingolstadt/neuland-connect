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
import { useI18n } from '#/lib/i18n/locale-context'
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
  pendingComponent: ConnectBootScreen,
  component: RessourcenPage,
})

function RessourcenPage() {
  const { user, error, retry } = useSignedInUser()

  if (!user) {
    return <ConnectBootScreen error={error} onRetry={retry} />
  }

  return <RessourcenContent user={user} />
}

function RessourcenContent({
  user,
}: {
  user: NonNullable<ReturnType<typeof useSignedInUser>['user']>
}) {
  const { t, locale } = useI18n()
  const groups = buildResourceHub(user.allGroups, locale)

  return (
    <PageShell>
      <AppHeader isSignedIn showDashboardLink />

      <PageMain>
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
            {t('resources.pageEyebrow')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('resources.pageTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-terminal-text/60">
            {t('resources.pageLead')}
          </p>
        </header>

        <TerminalPanel title={t('resources.panel')}>
          <ResourceHubContent groups={groups} />
        </TerminalPanel>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}
