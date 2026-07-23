import { createServerFn } from '@tanstack/react-start'
import { isGitHubConnected, parseUserAttributes } from '#/lib/authentik/types'

export type CurrentUser = {
  sub: string
  email: string
  name: string
  username: string
  groups: string[]
  accountCreatedAt: string | null
  attributes: ReturnType<typeof parseUserAttributes>
  githubConnected: boolean
  githubOrg: string | null
  teamSyncEnabled: boolean
  /** Authentik child groups under GITHUB_TEAM_PARENT_GROUP the user belongs to */
  githubTeamCount: number
}

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const { serverConfig } = await import('#/lib/config')
    const {
      getAuthentikUser,
      getAuthentikUserGroups,
      getManagedGitHubTeamMap,
    } = await import('#/lib/authentik/client')
    const { resolveSessionAuthentikUserId } = await import(
      '#/lib/authentik/session-user'
    )

    const sessionData = await requireSessionUser()
    if (!sessionData) {
      return null
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

    const [authentikUser, groups] = await Promise.all([
      getAuthentikUser(authentikUserId),
      getAuthentikUserGroups(authentikUserId).catch(() => [] as string[]),
    ])
    const attributes = parseUserAttributes(authentikUser.attributes)

    const teamParentGroup = serverConfig.github.teamParentGroup
    const hiddenGroups = new Set<string>()
    let githubTeamCount = 0
    if (teamParentGroup) {
      hiddenGroups.add(teamParentGroup)
      try {
        const managedMap = await getManagedGitHubTeamMap(teamParentGroup)
        for (const groupName of managedMap.keys()) {
          hiddenGroups.add(groupName)
        }
        githubTeamCount = groups.filter(group => managedMap.has(group)).length
      } catch {
        // Profile still works if team mapping is temporarily unavailable.
      }
    }

    const displayGroups =
      hiddenGroups.size > 0
        ? groups.filter(group => !hiddenGroups.has(group))
        : groups

    return {
      sub: user.sub,
      email: user.email || authentikUser.email,
      name: user.name || authentikUser.name,
      username: authentikUser.username,
      groups: displayGroups,
      accountCreatedAt: authentikUser.date_joined ?? null,
      attributes,
      githubConnected: isGitHubConnected(attributes),
      githubOrg: serverConfig.github.org ?? null,
      teamSyncEnabled: serverConfig.github.isTeamSyncConfigured,
      githubTeamCount,
    }
  },
)
