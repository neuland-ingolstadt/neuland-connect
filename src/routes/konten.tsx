import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
import { PageMain, PageShell } from '#/components/layout/page-shell'
import { useIntegrationCardHighlight } from '#/hooks/use-integration-card-highlight'
import {
  clearClientSignedInUserCache,
  setClientSignedInUserCache,
  useSignedInUser,
} from '#/hooks/use-signed-in-user'
import { APP_NAME, LOGIN_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'
import { LOADER_STALE_MS } from '#/lib/deferred-loader'
import { useI18n } from '#/lib/i18n/locale-context'
import type { MessageKey } from '#/lib/i18n/messages'
import { isDiscordInGuild } from '#/lib/integrations/discord/guild-status-display'
import { isGitHubInOrg } from '#/lib/integrations/github/org-status-display'
import {
  type CurrentUser,
  currentUserEquals,
  refreshCurrentUserFn,
  requireActiveSession,
} from '#/server/get-current-user'

export const Route = createFileRoute('/konten')({
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
  loader: async () => {
    // Cookie only — Authentik profile loads client-side (ConnectBootScreen).
    await requireActiveSession()
  },
  pendingMs: 0,
  pendingComponent: ConnectBootScreen,
  component: ConnectRoute,
})

function ConnectRoute() {
  const { user, error, retry } = useSignedInUser()

  if (!user) {
    return <ConnectBootScreen error={error} onRetry={retry} />
  }

  return <ConnectPage user={user} />
}

/** Server-callback `message` codes are protocol values — translate at display. */
function githubErrorKey(message: string | undefined): MessageKey {
  if (message === 'invalid_state') return 'toast.github.error.invalid_state'
  if (message === 'connection_failed')
    return 'toast.github.error.connection_failed'
  return 'toast.github.error.generic'
}

/** Server-callback `message` codes are protocol values — translate at display. */
function discordErrorKey(message: string | undefined): MessageKey {
  if (message === 'invalid_state') return 'toast.discord.error.invalid_state'
  if (message === 'connection_failed')
    return 'toast.discord.error.connection_failed'
  return 'toast.discord.error.generic'
}

function ConnectPage({ user: initialUser }: { user: CurrentUser }) {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [user, setUser] = useState<CurrentUser>(initialUser)
  const { t } = useI18n()

  useIntegrationCardHighlight()

  useEffect(() => {
    setUser(prev => (currentUserEquals(prev, initialUser) ? prev : initialUser))
  }, [initialUser])

  const refreshUser = useCallback(async () => {
    clearClientSignedInUserCache()
    const next = await refreshCurrentUserFn()

    if (!next) {
      await navigate({ to: ROUTES.LOGIN, search: LOGIN_SEARCH_DEFAULTS })
      return null
    }

    setClientSignedInUserCache(next)
    setUser(prev => (currentUserEquals(prev, next) ? prev : next))
    return next
  }, [navigate])

  useEffect(() => {
    if (search.integration !== 'github' || !search.status) {
      return
    }

    if (search.status === 'success') {
      toast.success(t('toast.github.connected'))
    } else if (search.status === 'disconnected') {
      toast.success(t('toast.github.disconnected'))
    } else if (search.status === 'error') {
      toast.error(t(githubErrorKey(search.message)))
    }

    void refreshUser()

    const retryInvalidates = [500, 1500, 4000].map(delay =>
      window.setTimeout(() => {
        void refreshUser()
      }, delay),
    )

    window.history.replaceState({}, '', ROUTES.KONTEN)

    return () => {
      for (const timeoutId of retryInvalidates) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [refreshUser, search.integration, search.status, search.message, t])

  useEffect(() => {
    if (search.integration !== 'discord' || !search.status) {
      return
    }

    if (search.status === 'success') {
      toast.success(t('toast.discord.connected'))
    } else if (search.status === 'disconnected') {
      toast.success(t('toast.discord.disconnected'))
    } else if (search.status === 'error') {
      toast.error(t(discordErrorKey(search.message)))
    }

    void refreshUser()

    const retryInvalidates = [500, 1500, 4000].map(delay =>
      window.setTimeout(() => {
        void refreshUser()
      }, delay),
    )

    window.history.replaceState({}, '', ROUTES.KONTEN)

    return () => {
      for (const timeoutId of retryInvalidates) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [refreshUser, search.integration, search.status, search.message, t])

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

      <PageMain>
        <header className="mb-6 max-w-2xl">
          <p className="eyebrow">{t('konten.eyebrow')}</p>
          <h1 className="page-title mt-2">{t('konten.title')}</h1>
          <p className="page-lead mt-2">{t('konten.lead')}</p>
        </header>

        <div className="min-w-0 space-y-5">
          <DashboardActionBanner
            githubConnected={user.githubConnected}
            githubOrgStatus={user.attributes.githubOrgStatus}
            githubOrg={user.githubOrg}
            discordConnected={user.discordConnected}
            discordGuildStatus={user.attributes.discordGuildStatus}
            nextSignedIn={user.nextSession.signedIn}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="min-w-0 space-y-5 lg:col-span-2">
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

            <div className="min-w-0">
              <UserDataCard
                name={user.name}
                email={user.email}
                username={user.username}
                groups={user.groups}
              />
            </div>
          </div>
        </div>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}
