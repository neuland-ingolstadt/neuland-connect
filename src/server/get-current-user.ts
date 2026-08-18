import { createServerFn } from '@tanstack/react-start'
import {
  isDiscordConnected,
  isGitHubConnected,
  parseUserAttributes,
} from '#/lib/authentik/types'

export type CurrentUser = {
  sub: string
  email: string
  name: string
  username: string
  groups: string[]
  /** Sync-mapped groups are listed under GitHub/Discord cards instead of the profile. */
  integrationGroupsShownSeparately: boolean
  accountCreatedAt: string | null
  attributes: ReturnType<typeof parseUserAttributes>
  githubConnected: boolean
  githubOrg: string | null
  teamSyncEnabled: boolean
  /** GitHub team slugs mapped from Authentik groups the user belongs to */
  githubTeams: string[]
  discordConnected: boolean
  discordOAuthEnabled: boolean
  roleSyncEnabled: boolean
  /** Authentik group names that map to Discord roles */
  discordRoles: string[]
}

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const { serverConfig } = await import('#/lib/config')
    const {
      getAuthentikUser,
      getAuthentikUserGroups,
      getManagedDiscordRoleMap,
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
    const githubConnected = isGitHubConnected(attributes)
    const discordConnected = isDiscordConnected(attributes)

    const hiddenGroups = new Set<string>()
    let githubTeams: string[] = []
    let discordRoles: string[] = []
    if (serverConfig.github.isTeamSyncConfigured) {
      try {
        const managedMap = await getManagedGitHubTeamMap()
        if (githubConnected) {
          for (const groupName of managedMap.keys()) {
            hiddenGroups.add(groupName)
          }
        }
        githubTeams = [
          ...new Set(
            groups.flatMap(group => {
              const team = managedMap.get(group)
              return team ? [team] : []
            }),
          ),
        ].sort((a, b) => a.localeCompare(b))
      } catch {
        // Profile still works if team mapping is temporarily unavailable.
      }
    }

    if (serverConfig.discord.isRoleSyncConfigured) {
      try {
        const managedMap = await getManagedDiscordRoleMap()
        if (discordConnected) {
          for (const groupName of managedMap.keys()) {
            hiddenGroups.add(groupName)
          }
        }
        discordRoles = [
          ...new Set(
            groups.flatMap(group => (managedMap.has(group) ? [group] : [])),
          ),
        ].sort((a, b) => a.localeCompare(b, 'de'))
      } catch {
        // Profile still works if role mapping is temporarily unavailable.
      }
    }

    const integrationGroupsShownSeparately = hiddenGroups.size > 0
    const profileGroups = integrationGroupsShownSeparately
      ? groups.filter(group => !hiddenGroups.has(group))
      : groups

    return {
      sub: user.sub,
      email: user.email || authentikUser.email,
      name: user.name || authentikUser.name,
      username: authentikUser.username,
      groups: profileGroups,
      integrationGroupsShownSeparately,
      accountCreatedAt: authentikUser.date_joined ?? null,
      attributes,
      githubConnected,
      githubOrg: serverConfig.github.org ?? null,
      teamSyncEnabled: serverConfig.github.isTeamSyncConfigured,
      githubTeams,
      discordConnected,
      discordOAuthEnabled: serverConfig.discord.isOAuthConfigured,
      roleSyncEnabled: serverConfig.discord.isRoleSyncConfigured,
      discordRoles,
    }
  },
)
