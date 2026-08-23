import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DashboardActionBanner } from '#/components/dashboard/dashboard-action-banner'
import { DiscordConnectionCard } from '#/components/dashboard/discord-connection-card'
import { GitHubConnectionCard } from '#/components/dashboard/github-connection-card'
import { MembershipCard } from '#/components/dashboard/membership-card'
import { UserDataCard } from '#/components/dashboard/user-data-card'
import { DeferredValue } from '#/components/deferred-value'
import { AppHeader } from '#/components/layout/app-header'
import { KontenLoadingShell } from '#/components/layout/konten-loading-shell'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { APP_NAME, LOGIN_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'
import { LOADER_STALE_MS } from '#/lib/deferred-loader'
import { isDiscordInGuild } from '#/lib/integrations/discord/guild-status-display'
import { isGitHubInOrg } from '#/lib/integrations/github/org-status-display'
import {
  type CurrentUser,
  currentUserEquals,
  refreshCurrentUserFn,
  requireSignedInUser,
} from '#/server/get-current-user'

export const Route = createFileRoute('/connect')({
  head: () => ({
    meta: [{ title: `Konten · ${APP_NAME}` }],
  }),
  staleTime: LOADER_STALE_MS,
  gcTime: 5 * 60_000,
  validateSearch: (search: Record<string, unknown>) => ({
    integration:
      typeof search.integration === 'string' ? search.integration : undefined,
    status: typeof search.status === 'string' ? search.status : undefined,
    message: typeof search.message === 'string' ? search.message : undefined,
  }),
  loader: async () => ({
    user: await requireSignedInUser(),
  }),
  component: ConnectRoute,
})

function ConnectRoute() {
  const { user } = Route.useLoaderData()

  return (
    <DeferredValue value={user} fallback={<KontenLoadingShell />}>
      {resolvedUser => <ConnectPage user={resolvedUser} />}
    </DeferredValue>
  )
}

function ConnectPage({ user: loaderUser }: { user: CurrentUser }) {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [user, setUser] = useState<CurrentUser>(loaderUser)

  useEffect(() => {
    setUser(prev => (currentUserEquals(prev, loaderUser) ? prev : loaderUser))
  }, [loaderUser])

  const refreshUser = useCallback(async () => {
    const next = await refreshCurrentUserFn()

    if (!next) {
      await navigate({ to: ROUTES.LOGIN, search: LOGIN_SEARCH_DEFAULTS })
      return null
    }

    setUser(prev => (currentUserEquals(prev, next) ? prev : next))
    return next
  }, [navigate])

  useEffect(() => {
    if (search.integration !== 'github' || !search.status) {
      return
    }

    if (search.status === 'success') {
      toast.success('GitHub verbunden.')
    } else if (search.status === 'disconnected') {
      toast.success('GitHub-Verbindung getrennt.')
    } else if (search.status === 'error') {
      toast.error('GitHub-Verbindung fehlgeschlagen.')
    }

    void refreshUser()

    const retryInvalidates = [500, 1500, 4000].map(delay =>
      window.setTimeout(() => {
        void refreshUser()
      }, delay),
    )

    window.history.replaceState({}, '', ROUTES.CONNECT)

    return () => {
      for (const timeoutId of retryInvalidates) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [refreshUser, search.integration, search.status])

  useEffect(() => {
    if (search.integration !== 'discord' || !search.status) {
      return
    }

    if (search.status === 'success') {
      toast.success('Discord verbunden.')
    } else if (search.status === 'disconnected') {
      toast.success('Discord-Verbindung getrennt.')
    } else if (search.status === 'error') {
      toast.error('Discord-Verbindung fehlgeschlagen.')
    }

    void refreshUser()

    const retryInvalidates = [500, 1500, 4000].map(delay =>
      window.setTimeout(() => {
        void refreshUser()
      }, delay),
    )

    window.history.replaceState({}, '', ROUTES.CONNECT)

    return () => {
      for (const timeoutId of retryInvalidates) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [refreshUser, search.integration, search.status])

  useEffect(() => {
    if (!user.githubConnected) {
      return
    }

    if (isGitHubInOrg(user.attributes.githubOrgStatus)) {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshUser()
    }, 3000)

    const stopPollingId = window.setTimeout(() => {
      window.clearInterval(intervalId)
    }, 30_000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(stopPollingId)
    }
  }, [refreshUser, user.githubConnected, user.attributes.githubOrgStatus])

  useEffect(() => {
    if (!user.discordConnected) {
      return
    }

    if (isDiscordInGuild(user.attributes.discordGuildStatus)) {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshUser()
    }, 3000)

    const stopPollingId = window.setTimeout(() => {
      window.clearInterval(intervalId)
    }, 30_000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(stopPollingId)
    }
  }, [refreshUser, user.discordConnected, user.attributes.discordGuildStatus])

  return (
    <PageShell>
      <AppHeader isSignedIn />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
              Konten
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Konten verknüpfen
            </h1>
          </div>
        </header>

        <div className="space-y-5">
          <DashboardActionBanner
            githubConnected={user.githubConnected}
            githubOrgStatus={user.attributes.githubOrgStatus}
            githubOrg={user.githubOrg}
            discordConnected={user.discordConnected}
            discordGuildStatus={user.attributes.discordGuildStatus}
            nextSignedIn={user.nextSession.signedIn}
          />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <GitHubConnectionCard
                connected={user.githubConnected}
                attributes={user.attributes}
                githubOrg={user.githubOrg}
                teamSyncEnabled={user.teamSyncEnabled}
                githubTeams={user.githubTeams}
              />
              <DiscordConnectionCard
                connected={user.discordConnected}
                attributes={user.attributes}
                discordRoles={user.discordRoles}
              />
              <MembershipCard nextSession={user.nextSession} />
            </div>

            <UserDataCard
              name={user.name}
              email={user.email}
              username={user.username}
              groups={user.groups}
            />
          </div>
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
