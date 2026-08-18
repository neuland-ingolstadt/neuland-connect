import { parseAuthentikJson } from '#/lib/authentik/json'
import type {
  AuthentikGroupListResponse,
  AuthentikGroupResponse,
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

export async function getAuthentikUserGroups(
  userId: string | number,
): Promise<string[]> {
  const groupNames = new Set<string>()
  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      members_by_pk: String(userId),
      page_size: String(pageSize),
      page: String(page),
    })

    const response = await authentikFetch<AuthentikGroupListResponse>(
      `/api/v3/core/groups/?${params.toString()}`,
    )

    for (const group of response.results) {
      groupNames.add(group.name)
    }

    if (response.results.length < pageSize) {
      break
    }

    page += 1
  }

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

/**
 * Authentik group name → GitHub team slug for every group with `github_team` set.
 */
export async function getManagedGitHubTeamMap(): Promise<Map<string, string>> {
  const teams = await getManagedGitHubTeams()
  return new Map(teams.map(team => [team.groupName, team.slug]))
}

/**
 * Authentik group name → Discord role snowflake for every group with `discord_role` set.
 */
export async function getManagedDiscordRoleMap(): Promise<Map<string, string>> {
  const managed = new Map<string, string>()
  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      include_users: 'false',
      page_size: String(pageSize),
      page: String(page),
    })

    const response = await authentikFetch<AuthentikGroupListResponse>(
      `/api/v3/core/groups/?${params.toString()}`,
    )

    for (const group of response.results) {
      const roleId = readDiscordRoleId(group.attributes)
      if (roleId) {
        managed.set(group.name, roleId)
      }
    }

    if (response.results.length < pageSize) {
      break
    }

    page += 1
  }

  return managed
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
  const managed: Array<{ groupName: string; groupPk: string; slug: string }> =
    []
  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      include_users: 'false',
      page_size: String(pageSize),
      page: String(page),
    })

    const response = await authentikFetch<AuthentikGroupListResponse>(
      `/api/v3/core/groups/?${params.toString()}`,
    )

    for (const group of response.results) {
      const slug = readGitHubTeamSlug(group.attributes)
      if (slug) {
        managed.push({
          groupName: group.name,
          groupPk: group.pk,
          slug,
        })
      }
    }

    if (response.results.length < pageSize) {
      break
    }

    page += 1
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
    const byEmail = await listAuthentikUsers({ email: input.email })
    const user = byEmail.results[0]
    if (user) {
      return user
    }
  }

  if (input.username) {
    const byUsername = await listAuthentikUsers({ username: input.username })
    const user = byUsername.results[0]
    if (user) {
      return user
    }
  }

  if (input.email) {
    const bySearch = await listAuthentikUsers({ search: input.email })
    const user = bySearch.results[0]
    if (user) {
      return user
    }
  }

  throw new AuthentikApiError(
    404,
    `Benutzer konnte in Authentik nicht gefunden werden (sub: "${input.sub}"). ` +
      'Bitte wende dich an den Administrator.',
  )
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

export { AuthentikApiError }
