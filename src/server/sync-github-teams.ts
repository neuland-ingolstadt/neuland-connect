import { createServerFn } from '@tanstack/react-start'
import { isGitHubConnected, parseUserAttributes } from '#/lib/authentik/types'
import { GITHUB_ORG_STATUSES } from '#/lib/constants'

export type SyncGitHubTeamsFnResult = {
  status: 'synced' | 'skipped' | 'error'
  desired: string[]
  added: string[]
  removed: string[]
  error?: string
}

export const syncGitHubTeamsFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<SyncGitHubTeamsFnResult> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const { serverConfig } = await import('#/lib/config')
    const { getAuthentikUser } = await import('#/lib/authentik/client')
    const { resolveSessionAuthentikUserId } = await import(
      '#/lib/authentik/session-user'
    )
    const { syncUserGitHubTeams } = await import(
      '#/lib/integrations/github/teams-sync'
    )

    const sessionData = await requireSessionUser()
    if (!sessionData) {
      throw new Error('Nicht angemeldet.')
    }

    if (!serverConfig.github.isTeamSyncConfigured) {
      throw new Error('Team-Sync ist nicht konfiguriert.')
    }

    const { user, session } = sessionData
    const authentikUserId = await resolveSessionAuthentikUserId(user)

    if (!user.authentikUserId) {
      await session.update({
        ...session.data,
        user: {
          ...user,
          authentikUserId,
        },
      })
    }

    const authentikUser = await getAuthentikUser(authentikUserId)
    const attributes = parseUserAttributes(authentikUser.attributes)

    if (!isGitHubConnected(attributes) || !attributes.githubUsername) {
      throw new Error('GitHub ist nicht verbunden.')
    }

    if (
      attributes.githubOrgStatus !== GITHUB_ORG_STATUSES.MEMBER &&
      attributes.githubOrgStatus !== GITHUB_ORG_STATUSES.ADMIN
    ) {
      throw new Error(
        'Team-Sync ist erst nach Annahme der Org-Einladung möglich.',
      )
    }

    const result = await syncUserGitHubTeams(
      authentikUserId,
      attributes.githubUsername,
    )

    if (result.status === 'error') {
      throw new Error(result.error ?? 'Team-Sync fehlgeschlagen.')
    }

    return {
      status: result.status,
      desired: result.desired,
      added: result.added,
      removed: result.removed,
    }
  },
)
