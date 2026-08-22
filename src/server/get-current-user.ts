import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  isDiscordConnected,
  isGitHubConnected,
  parseUserAttributes,
} from '#/lib/authentik/types'
import { ROUTES } from '#/lib/constants'
import type { NeulandNextMemberSession } from '#/lib/integrations/neuland-next/session'
import { isSpecialProfileGroup } from '#/lib/profile-groups'

export type CurrentUser = {
  sub: string
  email: string
  name: string
  username: string
  /** Profile-visible Authentik groups (integration-mapped groups may be hidden). */
  groups: string[]
  /** Full Authentik group membership — use for access checks. */
  allGroups: string[]
  accountCreatedAt: string | null
  attributes: ReturnType<typeof parseUserAttributes>
  githubConnected: boolean
  githubOrg: string | null
  teamSyncEnabled: boolean
  /** GitHub team slugs mapped from Authentik groups the user belongs to */
  githubTeams: string[]
  discordConnected: boolean
  /** Authentik group names that map to Discord roles */
  discordRoles: string[]
  /** Active Neuland Next Mitgliedsausweis OIDC session (refresh token). */
  nextSession: NeulandNextMemberSession
}

const USER_CACHE_FRESH_MS = 15_000

type UserCacheEntry = {
  user: CurrentUser
  fetchedAt: number
}

const userCache = new Map<string, UserCacheEntry>()
const userInflight = new Map<string, Promise<CurrentUser | null>>()

export function invalidateCurrentUserCache(
  authentikUserId?: string | number,
): void {
  if (authentikUserId === undefined) {
    userCache.clear()
    return
  }

  userCache.delete(String(authentikUserId))
}

export function currentUserEquals(a: CurrentUser, b: CurrentUser): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Cookie session only - used by / and /login so those routes skip Authentik. */
export const hasActiveSessionFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<boolean> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const sessionData = await requireSessionUser()
    return Boolean(sessionData)
  },
)

async function fetchCurrentUserFromAuthentik(): Promise<CurrentUser | null> {
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
  const cacheKey = String(authentikUserId)

  const inflight = userInflight.get(cacheKey)
  if (inflight) {
    return inflight
  }

  const request = (async () => {
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
      getManagedIntegrationMaps().catch(() => emptyMaps),
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

    const profileGroups =
      hiddenGroups.size > 0
        ? groups.filter(group => !hiddenGroups.has(group))
        : groups

    const currentUser: CurrentUser = {
      sub: user.sub,
      email: user.email || authentikUser.email,
      name: authentikUser.name.trim() || user.name,
      username: authentikUser.username,
      groups: profileGroups,
      allGroups: groups,
      accountCreatedAt: authentikUser.date_joined ?? null,
      attributes,
      githubConnected,
      githubOrg: serverConfig.github.org ?? null,
      teamSyncEnabled,
      githubTeams,
      discordConnected,
      discordRoles,
      nextSession,
    }

    userCache.set(cacheKey, { user: currentUser, fetchedAt: Date.now() })
    return currentUser
  })()

  userInflight.set(cacheKey, request)
  return request.finally(() => {
    userInflight.delete(cacheKey)
  })
}

async function resolveCurrentUser(options: {
  allowCache: boolean
}): Promise<CurrentUser | null> {
  if (options.allowCache) {
    const { requireSessionUser } = await import('#/lib/session.server')
    const { resolveSessionAuthentikUserId } = await import(
      '#/lib/authentik/session-user'
    )

    const sessionData = await requireSessionUser()
    if (!sessionData) {
      return null
    }

    const authentikUserId = await resolveSessionAuthentikUserId(
      sessionData.user,
    )
    const cached = userCache.get(String(authentikUserId))
    if (cached && Date.now() - cached.fetchedAt < USER_CACHE_FRESH_MS) {
      return cached.user
    }
  }

  return fetchCurrentUserFromAuthentik()
}

/** Cached Authentik profile for navigation / SSR. */
export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    return resolveCurrentUser({ allowCache: true })
  },
)

export async function requireSignedInUser(): Promise<CurrentUser> {
  const user = await getCurrentUserFn()

  if (!user) {
    throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
  }

  return user
}

/** Bypass cache after connect/disconnect or while polling org/guild status. */
export const refreshCurrentUserFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<CurrentUser | null> => {
    return resolveCurrentUser({ allowCache: false })
  },
)
