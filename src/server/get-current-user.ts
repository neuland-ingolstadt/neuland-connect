import { createServerFn } from '@tanstack/react-start'
import {
  isDiscordConnected,
  isGitHubConnected,
  parseUserAttributes,
} from '#/lib/authentik/types'
import type { NeulandNextMemberSession } from '#/lib/integrations/neuland-next/session'
import { isSpecialProfileGroup } from '#/lib/profile-groups'

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
  /** GitHub team slugs mapped from Authentik groups the user belongs to */
  githubTeams: string[]
  discordConnected: boolean
  discordOAuthEnabled: boolean
  roleSyncEnabled: boolean
  /** Authentik group names that map to Discord roles */
  discordRoles: string[]
  /** Active Neuland Next Mitgliedsausweis OIDC session (refresh token). */
  nextSession: NeulandNextMemberSession
}

/** Cookie session only - used by / and /login so those routes skip Authentik. */
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
    const { getNeulandNextMemberSession } = await import(
      '#/lib/integrations/neuland-next/session'
    )
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

    const inactiveNextSession: NeulandNextMemberSession = {
      signedIn: false,
      expiresAt: null,
    }

    const [authentikUser, groups, maps, nextSession] = await Promise.all([
      getAuthentikUser(authentikUserId),
      getAuthentikUserGroups(authentikUserId).catch(() => [] as string[]),
      teamSyncEnabled || roleSyncEnabled
        ? getManagedIntegrationMaps().catch(() => emptyMaps)
        : Promise.resolve(emptyMaps),
      getNeulandNextMemberSession(authentikUserId).catch(
        () => inactiveNextSession,
      ),
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
          if (!isSpecialProfileGroup(groupName)) {
            hiddenGroups.add(groupName)
          }
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
          if (!isSpecialProfileGroup(groupName)) {
            hiddenGroups.add(groupName)
          }
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

    const profileGroups =
      hiddenGroups.size > 0
        ? groups.filter(group => !hiddenGroups.has(group))
        : groups

    return {
      sub: user.sub,
      email: user.email || authentikUser.email,
      name: authentikUser.name.trim() || user.name,
      username: authentikUser.username,
      groups: profileGroups,
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
      nextSession,
    }
  },
)
