import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DashboardActionBanner } from '#/components/dashboard/dashboard-action-banner'
import { DiscordConnectionCard } from '#/components/dashboard/discord-connection-card'
import { GitHubConnectionCard } from '#/components/dashboard/github-connection-card'
import { MembershipCard } from '#/components/dashboard/membership-card'
import { UserDataCard } from '#/components/dashboard/user-data-card'
import { AppHeader } from '#/components/layout/app-header'
import { ConnectBootScreen } from '#/components/layout/connect-boot-screen'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { ROUTES } from '#/lib/constants'
import { isDiscordInGuild } from '#/lib/integrations/discord/guild-status-display'
import { isGitHubInOrg } from '#/lib/integrations/github/org-status-display'
import { type CurrentUser, getCurrentUserFn } from '#/server/get-current-user'

/**
 * Boot UX middle ground:
 * - pendingMs: skip the boot screen when the loader finishes quickly (cache / warm Authentik)
 * - pendingMinMs: if boot does show, hold briefly so it does not flash off
 * Replaces the old fixed 900ms client delay after data was already ready.
 */
const BOOT_PENDING_MS = 150
const BOOT_PENDING_MIN_MS = 350

export const Route = createFileRoute('/dashboard')({
  staleTime: 30_000,
  pendingMs: BOOT_PENDING_MS,
  pendingMinMs: BOOT_PENDING_MIN_MS,
  pendingComponent: ConnectBootScreen,
  validateSearch: (search: Record<string, unknown>) => ({
    integration:
      typeof search.integration === 'string' ? search.integration : undefined,
    status: typeof search.status === 'string' ? search.status : undefined,
    message: typeof search.message === 'string' ? search.message : undefined,
  }),
  loader: async () => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
    }

    return user
  },
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const loaderUser = Route.useLoaderData()
  const [user, setUser] = useState<CurrentUser>(loaderUser)

  useEffect(() => {
    setUser(loaderUser)
  }, [loaderUser])

  const refreshUser = useCallback(async () => {
    const next = await getCurrentUserFn()

    if (!next) {
      await navigate({ to: ROUTES.LOGIN, search: { error: undefined } })
      return null
    }

    setUser(next)
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

    window.history.replaceState({}, '', ROUTES.DASHBOARD)

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

    window.history.replaceState({}, '', ROUTES.DASHBOARD)

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

  const firstName = user.name.split(' ')[0]

  return (
    <PageShell>
      <AppHeader userName={user.name} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-lightGreen">
              Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Hallo {firstName}
            </h1>
          </div>
        </header>

        <div className="space-y-5">
          <DashboardActionBanner
            githubConnected={user.githubConnected}
            githubOrgStatus={user.attributes.githubOrgStatus}
            githubOrg={user.githubOrg}
            discordOAuthEnabled={user.discordOAuthEnabled}
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
              {user.discordOAuthEnabled ? (
                <DiscordConnectionCard
                  connected={user.discordConnected}
                  attributes={user.attributes}
                  roleSyncEnabled={user.roleSyncEnabled}
                  discordRoles={user.discordRoles}
                />
              ) : null}
              <MembershipCard nextSession={user.nextSession} />
            </div>

            <UserDataCard
              name={user.name}
              email={user.email}
              username={user.username}
              groups={user.groups}
              integrationGroupsShownSeparately={
                user.integrationGroupsShownSeparately
              }
              accountCreatedAt={user.accountCreatedAt}
            />
          </div>
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
