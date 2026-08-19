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

/** Cookie session only — used by / and /login so those routes skip Authentik. */
export const hasActiveSessionFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<boolean> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const sessionData = await requireSessionUser()
    return Boolean(sessionData)
  },
)

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const { serverConfig } = await import('#/lib/config')
    const {
      getAuthentikUser,
      getAuthentikUserGroups,
      getManagedIntegrationMaps,
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

    const teamSyncEnabled = serverConfig.github.isTeamSyncConfigured
    const roleSyncEnabled = serverConfig.discord.isRoleSyncConfigured
    const emptyMaps = {
      githubTeams: new Map<string, string>(),
      discordRoles: new Map<string, string>(),
    }

    const [authentikUser, groups, maps] = await Promise.all([
      getAuthentikUser(authentikUserId),
      getAuthentikUserGroups(authentikUserId).catch(() => [] as string[]),
      teamSyncEnabled || roleSyncEnabled
        ? getManagedIntegrationMaps().catch(() => emptyMaps)
        : Promise.resolve(emptyMaps),
    ])
    const attributes = parseUserAttributes(authentikUser.attributes)
    const githubConnected = isGitHubConnected(attributes)
    const discordConnected = isDiscordConnected(attributes)

    const hiddenGroups = new Set<string>()
    let githubTeams: string[] = []
    let discordRoles: string[] = []

    if (teamSyncEnabled) {
      if (githubConnected) {
        for (const groupName of maps.githubTeams.keys()) {
          hiddenGroups.add(groupName)
        }
      }
      githubTeams = [
        ...new Set(
          groups.flatMap(group => {
            const team = maps.githubTeams.get(group)
            return team ? [team] : []
          }),
        ),
      ].sort((a, b) => a.localeCompare(b))
    }

    if (roleSyncEnabled) {
      if (discordConnected) {
        for (const groupName of maps.discordRoles.keys()) {
          hiddenGroups.add(groupName)
        }
      }
      discordRoles = [
        ...new Set(
          groups.flatMap(group =>
            maps.discordRoles.has(group) ? [group] : [],
          ),
        ),
      ].sort((a, b) => a.localeCompare(b, 'de'))
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
      teamSyncEnabled,
      githubTeams,
      discordConnected,
      discordOAuthEnabled: serverConfig.discord.isOAuthConfigured,
      roleSyncEnabled,
      discordRoles,
    }
  },
)
