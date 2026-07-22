import { AUTHENTIK_ATTRIBUTES, type GitHubOrgStatus } from '#/lib/constants'

export type GitHubUserAttributes = {
  githubUsername: string | null
  githubId: string | null
  githubConnectedAt: string | null
  githubOrgStatus: GitHubOrgStatus | null
  githubOrgInvitedAt: string | null
  githubOrgLastError: string | null
}

export type UserAttributes = GitHubUserAttributes

export type AuthentikUserResponse = {
  pk: number
  uuid?: string
  username: string
  name: string
  email: string
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
}

export type AuthentikGroupListResponse = {
  pagination: {
    count: number
  }
  results: AuthentikGroupResponse[]
}

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
  }
}

function parseGitHubOrgStatus(value: string | null): GitHubOrgStatus | null {
  if (value === 'invited' || value === 'member') {
    return value
  }

  return null
}

export function isGitHubConnected(attributes: UserAttributes): boolean {
  return Boolean(attributes.githubUsername && attributes.githubId)
}
