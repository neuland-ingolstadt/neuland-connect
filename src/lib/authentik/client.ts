import { parseAuthentikJson } from '#/lib/authentik/json'
import type {
  AuthentikGroupListResponse,
  AuthentikGroupResponse,
  AuthentikOAuth2Provider,
  AuthentikOAuth2ProviderListResponse,
  AuthentikOAuth2RefreshToken,
  AuthentikOAuth2RefreshTokenListResponse,
  AuthentikUserListResponse,
  AuthentikUserResponse,
  ResolveAuthentikUserInput,
} from '#/lib/authentik/types'
import { serverConfig } from '#/lib/config'
import { AUTHENTIK_ATTRIBUTES } from '#/lib/constants'
import { getAuthentikErrorMessage } from '#/lib/errors'
import { parseDiscordSnowflakeAttribute } from '#/lib/integrations/discord/snowflake'

class AuthentikApiError extends Error {
  constructor(
    readonly status: number,
    message?: string,
  ) {
    super(message ?? getAuthentikErrorMessage(status))
    this.name = 'AuthentikApiError'
  }
}

const attributeWriteLocks = new Map<string, Promise<unknown>>()

async function withAuthentikUserAttributeLock<T>(
  userId: string | number,
  operation: () => Promise<T>,
): Promise<T> {
  const key = String(userId)
  const previous = attributeWriteLocks.get(key) ?? Promise.resolve()
  const current = previous.then(operation, operation)
  attributeWriteLocks.set(
    key,
    current.catch(() => undefined),
  )

  try {
    return await current
  } finally {
    if (attributeWriteLocks.get(key) === current) {
      attributeWriteLocks.delete(key)
    }
  }
}

async function authentikFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${serverConfig.authentik.apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serverConfig.authentik.apiToken}`,
      Accept: 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new AuthentikApiError(response.status)
  }

  const text = await response.text()
  return parseAuthentikJson<T>(text)
}

function encodeUserId(userId: string | number): string {
  return encodeURIComponent(String(userId))
}

export function getAuthentikApiUserId(user: AuthentikUserResponse): string {
  return String(user.pk)
}

async function listAuthentikUsers(
  query: Record<string, string>,
): Promise<AuthentikUserListResponse> {
  const params = new URLSearchParams(query)
  return authentikFetch<AuthentikUserListResponse>(
    `/api/v3/core/users/?${params.toString()}`,
  )
}

export async function getAuthentikUser(
  userId: string | number,
): Promise<AuthentikUserResponse> {
  return authentikFetch<AuthentikUserResponse>(
    `/api/v3/core/users/${encodeUserId(userId)}/`,
  )
}

async function listAuthentikGroups(options?: {
  membersByPk?: string | number
}): Promise<AuthentikGroupResponse[]> {
  const groups: AuthentikGroupResponse[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      include_users: 'false',
      page_size: String(pageSize),
      page: String(page),
    })

    if (options?.membersByPk !== undefined) {
      params.set('members_by_pk', String(options.membersByPk))
    }

    const response = await authentikFetch<AuthentikGroupListResponse>(
      `/api/v3/core/groups/?${params.toString()}`,
    )

    groups.push(...response.results)

    if (response.results.length < pageSize) {
      break
    }

    page += 1
  }

  return groups
}

export async function getAuthentikUserGroups(
  userId: string | number,
): Promise<string[]> {
  const groups = await listAuthentikGroups({ membersByPk: userId })
  const groupNames = new Set(groups.map(group => group.name))
  return [...groupNames].sort((a, b) => a.localeCompare(b, 'de'))
}

function readAuthentikScalarAttribute(
  attributes: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = attributes?.[key]

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Authentik may store snowflakes as integers. Prefer string attributes in
    // Authentik for Discord IDs - JSON numbers can lose precision above 2^53-1.
    return String(Math.trunc(value))
  }

  if (Array.isArray(value) && value.length > 0) {
    return readAuthentikScalarAttribute({ [key]: value[0] }, key)
  }

  return null
}

function readGitHubTeamSlug(
  attributes: Record<string, unknown> | undefined,
): string | null {
  return readAuthentikScalarAttribute(
    attributes,
    AUTHENTIK_ATTRIBUTES.GITHUB_TEAM,
  )
}

function readDiscordRoleId(
  attributes: Record<string, unknown> | undefined,
): string | null {
  return parseDiscordSnowflakeAttribute(
    attributes?.[AUTHENTIK_ATTRIBUTES.DISCORD_ROLE],
  )
}

const MANAGED_MAP_CACHE_TTL_MS = 60_000

export type ManagedIntegrationMaps = {
  githubTeams: Map<string, string>
  discordRoles: Map<string, string>
}

let managedMapsCache: {
  maps: ManagedIntegrationMaps
  expiresAt: number
} | null = null
let managedMapsInFlight: Promise<ManagedIntegrationMaps> | null = null

function emptyManagedMaps(): ManagedIntegrationMaps {
  return {
    githubTeams: new Map(),
    discordRoles: new Map(),
  }
}

async function fetchManagedIntegrationMaps(): Promise<ManagedIntegrationMaps> {
  const maps = emptyManagedMaps()
  const groups = await listAuthentikGroups()

  for (const group of groups) {
    const teamSlug = readGitHubTeamSlug(group.attributes)
    if (teamSlug) {
      maps.githubTeams.set(group.name, teamSlug)
    }

    const roleId = readDiscordRoleId(group.attributes)
    if (roleId) {
      maps.discordRoles.set(group.name, roleId)
    }
  }

  return maps
}

/**
 * Group-name maps for GitHub teams and Discord roles from one Authentik
 * group list. Cached briefly so dashboard loads do not re-walk every group.
 */
export async function getManagedIntegrationMaps(): Promise<ManagedIntegrationMaps> {
  if (managedMapsCache && Date.now() < managedMapsCache.expiresAt) {
    return managedMapsCache.maps
  }

  if (!managedMapsInFlight) {
    managedMapsInFlight = fetchManagedIntegrationMaps()
      .then(maps => {
        managedMapsCache = {
          maps,
          expiresAt: Date.now() + MANAGED_MAP_CACHE_TTL_MS,
        }
        return maps
      })
      .finally(() => {
        managedMapsInFlight = null
      })
  }

  return managedMapsInFlight
}

/**
 * Authentik group name → GitHub team slug for every group with `github_team` set.
 */
export async function getManagedGitHubTeamMap(): Promise<Map<string, string>> {
  const maps = await getManagedIntegrationMaps()
  return maps.githubTeams
}

/**
 * Authentik group name → Discord role snowflake for every group with `discord_role` set.
 */
export async function getManagedDiscordRoleMap(): Promise<Map<string, string>> {
  const maps = await getManagedIntegrationMaps()
  return maps.discordRoles
}

export type ManagedGitHubTeam = {
  groupName: string
  groupPk: string
  slug: string
  /** Authentik user PKs (numeric) that are direct members of this group */
  memberPks: Set<string>
}

/**
 * All Authentik groups with attribute `github_team`, including member PKs.
 */
export async function getManagedGitHubTeams(): Promise<ManagedGitHubTeam[]> {
  const groups = await listAuthentikGroups()
  const managed: Array<{ groupName: string; groupPk: string; slug: string }> =
    []

  for (const group of groups) {
    const slug = readGitHubTeamSlug(group.attributes)
    if (slug) {
      managed.push({
        groupName: group.name,
        groupPk: group.pk,
        slug,
      })
    }
  }

  return Promise.all(
    managed.map(async team => {
      const detail = await authentikFetch<AuthentikGroupResponse>(
        `/api/v3/core/groups/${encodeURIComponent(team.groupPk)}/?include_users=true`,
      )
      const memberPks = new Set<string>(
        (detail.users ?? []).map(userPk => String(userPk)),
      )
      return {
        ...team,
        memberPks,
      }
    }),
  )
}

export async function resolveAuthentikUser(
  input: ResolveAuthentikUserInput,
): Promise<AuthentikUserResponse> {
  try {
    return await getAuthentikUser(input.sub)
  } catch (error) {
    if (!(error instanceof AuthentikApiError) || error.status !== 404) {
      throw error
    }
  }

  if (input.email) {
    const normalizedEmail = input.email.trim().toLowerCase()
    if (normalizedEmail.length > 0) {
      const byEmail = await listAuthentikUsers({ email: input.email.trim() })
      const user = requireUniqueExactUserMatch(
        byEmail,
        candidate => candidate.email.trim().toLowerCase() === normalizedEmail,
      )
      if (user) {
        return user
      }
    }
  }

  if (input.username) {
    const normalizedUsername = input.username.trim().toLowerCase()
    if (normalizedUsername.length > 0) {
      const byUsername = await listAuthentikUsers({
        username: input.username.trim(),
      })
      const user = requireUniqueExactUserMatch(
        byUsername,
        candidate =>
          candidate.username.trim().toLowerCase() === normalizedUsername,
      )
      if (user) {
        return user
      }
    }
  }

  throw new AuthentikApiError(
    404,
    `Benutzer konnte in Authentik nicht gefunden werden (sub: "${input.sub}"). ` +
      'Bitte wende dich an den Administrator.',
  )
}

/**
 * Fail closed on ambiguous Authentik list results. Never bind `results[0]`
 * without an exact predicate match and pagination.count === 1.
 */
function requireUniqueExactUserMatch(
  response: AuthentikUserListResponse,
  isExactMatch: (user: AuthentikUserResponse) => boolean,
): AuthentikUserResponse | null {
  if (response.pagination.count > 1) {
    throw new AuthentikApiError(
      409,
      'Mehrere Authentik-Benutzer passen zur Anmeldung. ' +
        'Bitte wende dich an den Administrator.',
    )
  }

  if (response.pagination.count === 0 || response.results.length === 0) {
    return null
  }

  const matches = response.results.filter(isExactMatch)
  if (matches.length === 1) {
    return matches[0]
  }

  return null
}

export async function updateAuthentikUserAttributes(
  userId: string | number,
  attributes: Record<string, string>,
): Promise<AuthentikUserResponse> {
  return withAuthentikUserAttributeLock(userId, async () => {
    const currentUser = await getAuthentikUser(userId)

    return authentikFetch<AuthentikUserResponse>(
      `/api/v3/core/users/${encodeUserId(userId)}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributes: {
            ...currentUser.attributes,
            ...attributes,
          },
        }),
      },
    )
  })
}

function isAbsentAttribute(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

export async function patchAuthentikUserAttributes(
  userId: string | number,
  options: {
    set?: Record<string, string>
    setIfAbsent?: Record<string, string>
    remove?: string[]
  },
): Promise<AuthentikUserResponse> {
  return withAuthentikUserAttributeLock(userId, async () => {
    const currentUser = await getAuthentikUser(userId)
    const attributes = { ...currentUser.attributes }
    let changed = false

    for (const key of options.remove ?? []) {
      if (key in attributes) {
        delete attributes[key]
        changed = true
      }
    }

    if (options.set) {
      for (const [key, value] of Object.entries(options.set)) {
        if (attributes[key] !== value) {
          attributes[key] = value
          changed = true
        }
      }
    }

    if (options.setIfAbsent) {
      for (const [key, value] of Object.entries(options.setIfAbsent)) {
        if (isAbsentAttribute(attributes[key])) {
          attributes[key] = value
          changed = true
        }
      }
    }

    if (!changed) {
      return currentUser
    }

    return authentikFetch<AuthentikUserResponse>(
      `/api/v3/core/users/${encodeUserId(userId)}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attributes }),
      },
    )
  })
}

export async function listAllAuthentikUsers(): Promise<
  AuthentikUserResponse[]
> {
  const users: AuthentikUserResponse[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const response = await listAuthentikUsers({
      page: String(page),
      page_size: String(pageSize),
    })
    users.push(...response.results)

    if (response.results.length < pageSize) {
      break
    }

    page += 1
  }

  return users
}

export async function clearGitHubUserAttributes(
  userId: string | number,
): Promise<AuthentikUserResponse> {
  return withAuthentikUserAttributeLock(userId, async () => {
    const currentUser = await getAuthentikUser(userId)
    const attributes = { ...currentUser.attributes }

    delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_USERNAME]
    delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_ID]
    delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_CONNECTED_AT]
    delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_ORG_STATUS]
    delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_ORG_INVITED_AT]
    delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_ORG_LAST_ERROR]

    return authentikFetch<AuthentikUserResponse>(
      `/api/v3/core/users/${encodeUserId(userId)}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attributes }),
      },
    )
  })
}

export async function clearDiscordUserAttributes(
  userId: string | number,
): Promise<AuthentikUserResponse> {
  return withAuthentikUserAttributeLock(userId, async () => {
    const currentUser = await getAuthentikUser(userId)
    const attributes = { ...currentUser.attributes }

    delete attributes[AUTHENTIK_ATTRIBUTES.DISCORD_USERNAME]
    delete attributes[AUTHENTIK_ATTRIBUTES.DISCORD_ID]
    delete attributes[AUTHENTIK_ATTRIBUTES.DISCORD_CONNECTED_AT]
    delete attributes[AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_STATUS]
    delete attributes[AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_JOINED_AT]
    delete attributes[AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_LAST_ERROR]

    return authentikFetch<AuthentikUserResponse>(
      `/api/v3/core/users/${encodeUserId(userId)}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attributes }),
      },
    )
  })
}

const NEXT_PROVIDER_CACHE_TTL_MS = 5 * 60_000

let nextProviderCache: {
  slug: string
  pk: number
  expiresAt: number
} | null = null
let nextProviderInFlight: Promise<number | null> | null = null

async function listAuthentikOAuth2Providers(): Promise<
  AuthentikOAuth2Provider[]
> {
  const providers: AuthentikOAuth2Provider[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      page_size: String(pageSize),
      page: String(page),
    })
    const response = await authentikFetch<AuthentikOAuth2ProviderListResponse>(
      `/api/v3/providers/oauth2/?${params.toString()}`,
    )
    providers.push(...response.results)

    if (response.results.length < pageSize) {
      break
    }

    page += 1
  }

  return providers
}

async function resolveNeulandNextOAuthProviderId(): Promise<number | null> {
  const configured = serverConfig.authentik.nextMemberOAuthProviderId
  if (configured) {
    return configured
  }

  const slug = serverConfig.authentik.nextMemberAppSlug
  if (nextProviderCache && nextProviderCache.slug === slug) {
    if (Date.now() < nextProviderCache.expiresAt) {
      return nextProviderCache.pk
    }
  }

  if (!nextProviderInFlight) {
    nextProviderInFlight = listAuthentikOAuth2Providers()
      .then(providers => {
        const match = providers.find(
          provider => provider.assigned_application_slug === slug,
        )
        if (!match) {
          return null
        }

        nextProviderCache = {
          slug,
          pk: match.pk,
          expiresAt: Date.now() + NEXT_PROVIDER_CACHE_TTL_MS,
        }
        return match.pk
      })
      .finally(() => {
        nextProviderInFlight = null
      })
  }

  return nextProviderInFlight
}

export async function listNeulandNextRefreshTokensForUser(
  userId: string | number,
): Promise<AuthentikOAuth2RefreshToken[]> {
  const providerId = await resolveNeulandNextOAuthProviderId()
  if (providerId === null) {
    return []
  }

  const tokens: AuthentikOAuth2RefreshToken[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      user: String(userId),
      provider: String(providerId),
      page_size: String(pageSize),
      page: String(page),
    })
    const response =
      await authentikFetch<AuthentikOAuth2RefreshTokenListResponse>(
        `/api/v3/oauth2/refresh_tokens/?${params.toString()}`,
      )
    // Authentik includes the refresh token secret in this payload — keep
    // only status fields so it never sits in memory or logs.
    tokens.push(
      ...response.results.map(token => ({
        pk: token.pk,
        expires: token.expires,
        revoked: token.revoked,
      })),
    )

    if (response.results.length < pageSize) {
      break
    }

    page += 1
  }

  return tokens
}

export { AuthentikApiError }
