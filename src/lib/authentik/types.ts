import {
  AUTHENTIK_ATTRIBUTES,
  type DiscordGuildStatus,
  type GitHubOrgStatus,
} from '#/lib/constants'

export type GitHubUserAttributes = {
  githubUsername: string | null
  githubId: string | null
  githubConnectedAt: string | null
  githubOrgStatus: GitHubOrgStatus | null
  githubOrgInvitedAt: string | null
  githubOrgLastError: string | null
}

export type DiscordUserAttributes = {
  discordUsername: string | null
  discordId: string | null
  discordConnectedAt: string | null
  discordGuildStatus: DiscordGuildStatus | null
  discordGuildJoinedAt: string | null
  discordGuildLastError: string | null
}

export type UserAttributes = GitHubUserAttributes & DiscordUserAttributes

export type AuthentikUserResponse = {
  pk: number
  uuid?: string
  username: string
  name: string
  email: string
  date_joined?: string
  attributes: Record<string, unknown>
}

export type AuthentikUserListResponse = {
  pagination: {
    count: number
  }
  results: AuthentikUserResponse[]
}

export type AuthentikGroupResponse = {
  pk: string
  num_pk: number
  name: string
  attributes?: Record<string, unknown>
  children?: string[]
  children_obj?: AuthentikRelatedGroup[] | null
  /** User PKs when fetched with include_users=true */
  users?: Array<string | number>
}

export type AuthentikRelatedGroup = {
  pk: string
  name: string
  attributes?: Record<string, unknown>
}

export type AuthentikGroupListResponse = {
  pagination: {
    count: number
  }
  results: AuthentikGroupResponse[]
}

export type AuthentikOAuth2Provider = {
  pk: number
  name: string
  assigned_application_slug?: string | null
}

export type AuthentikOAuth2ProviderListResponse = {
  pagination: {
    count: number
  }
  results: AuthentikOAuth2Provider[]
}

export type AuthentikOAuth2RefreshToken = {
  pk: number
  expires?: string | null
  revoked?: boolean
}

export type AuthentikOAuth2RefreshTokenListResponse = {
  pagination: {
    count: number
  }
  results: AuthentikOAuth2RefreshToken[]
}

/** Authentik group name → GitHub team slug (from group attribute `github_team`) */
export type ManagedGitHubTeamMap = Map<string, string>

/** Authentik group name → Discord role snowflake (from group attribute `discord_role`) */
export type ManagedDiscordRoleMap = Map<string, string>

export type ResolveAuthentikUserInput = {
  sub: string
  email?: string
  username?: string
}

export function parseUserAttributes(
  attributes: Record<string, unknown> | undefined,
): UserAttributes {
  const getString = (key: string): string | null => {
    const value = attributes?.[key]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0]
    }
    return null
  }

  return {
    githubUsername: getString(AUTHENTIK_ATTRIBUTES.GITHUB_USERNAME),
    githubId: getString(AUTHENTIK_ATTRIBUTES.GITHUB_ID),
    githubConnectedAt: getString(AUTHENTIK_ATTRIBUTES.GITHUB_CONNECTED_AT),
    githubOrgStatus: parseGitHubOrgStatus(
      getString(AUTHENTIK_ATTRIBUTES.GITHUB_ORG_STATUS),
    ),
    githubOrgInvitedAt: getString(AUTHENTIK_ATTRIBUTES.GITHUB_ORG_INVITED_AT),
    githubOrgLastError: getString(AUTHENTIK_ATTRIBUTES.GITHUB_ORG_LAST_ERROR),
    discordUsername: getString(AUTHENTIK_ATTRIBUTES.DISCORD_USERNAME),
    discordId: getString(AUTHENTIK_ATTRIBUTES.DISCORD_ID),
    discordConnectedAt: getString(AUTHENTIK_ATTRIBUTES.DISCORD_CONNECTED_AT),
    discordGuildStatus: parseDiscordGuildStatus(
      getString(AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_STATUS),
    ),
    discordGuildJoinedAt: getString(
      AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_JOINED_AT,
    ),
    discordGuildLastError: getString(
      AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_LAST_ERROR,
    ),
  }
}

function parseGitHubOrgStatus(value: string | null): GitHubOrgStatus | null {
  if (value === 'invited' || value === 'member' || value === 'admin') {
    return value
  }

  return null
}

export function isGitHubConnected(attributes: UserAttributes): boolean {
  return Boolean(attributes.githubUsername && attributes.githubId)
}

function parseDiscordGuildStatus(
  value: string | null,
): DiscordGuildStatus | null {
  if (value === 'member') {
    return value
  }

  return null
}

export function isDiscordConnected(attributes: UserAttributes): boolean {
  return Boolean(attributes.discordUsername && attributes.discordId)
}
