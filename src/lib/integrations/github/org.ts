import { createSign } from 'node:crypto'
import { serverConfig } from '#/lib/config'

const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
} as const

type InstallationTokenResponse = {
  token: string
  expires_at: string
}

type OrgInvitation = {
  id: number
  invitee?: {
    id?: number
    login?: string
  } | null
}

let cachedInstallationToken: {
  token: string
  expiresAt: number
} | null = null

function requireGitHubOrgConfig(): {
  appId: string
  privateKey: string
  installationId: string
  org: string
} {
  const { appId, appPrivateKey, appInstallationId, org } = serverConfig.github

  if (!appId || !appPrivateKey || !appInstallationId || !org) {
    throw new Error('GitHub App org sync is not configured')
  }

  return {
    appId,
    privateKey: appPrivateKey,
    installationId: appInstallationId,
    org,
  }
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

function createGitHubAppJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64UrlEncode(
    JSON.stringify({
      iat: now - 60,
      exp: now + 600,
      iss: appId,
    }),
  )
  const signingInput = `${header}.${payload}`
  const signature = createSign('RSA-SHA256')
    .update(signingInput)
    .sign(privateKey)

  return `${signingInput}.${base64UrlEncode(signature)}`
}

async function getInstallationAccessToken(): Promise<string> {
  const now = Date.now()
  if (
    cachedInstallationToken &&
    cachedInstallationToken.expiresAt > now + 60_000
  ) {
    return cachedInstallationToken.token
  }

  const { appId, privateKey, installationId } = requireGitHubOrgConfig()
  const jwt = createGitHubAppJwt(appId, privateKey)

  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        ...GITHUB_API_HEADERS,
        Authorization: `Bearer ${jwt}`,
      },
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `GitHub installation token request failed (${response.status}): ${body}`,
    )
  }

  const data = (await response.json()) as InstallationTokenResponse
  cachedInstallationToken = {
    token: data.token,
    expiresAt: Date.parse(data.expires_at),
  }

  return data.token
}

async function githubAppFetch(
  pathOrUrl: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getInstallationAccessToken()
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `${GITHUB_API_BASE}${pathOrUrl}`

  return fetch(url, {
    ...init,
    headers: {
      ...GITHUB_API_HEADERS,
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null
  }

  for (const part of linkHeader.split(',')) {
    const match = part.trim().match(/^<([^>]+)>;\s*rel="next"$/)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

async function githubAppFetchAllPages<T>(path: string): Promise<T[]> {
  const results: T[] = []
  let nextUrl: string | null = path.includes('?')
    ? `${path}&per_page=100`
    : `${path}?per_page=100`

  while (nextUrl) {
    const response = await githubAppFetch(nextUrl)

    if (!response.ok) {
      const body = await response.text()
      throw new Error(
        `GitHub paginated request failed (${response.status}) for ${path}: ${body}`,
      )
    }

    const page = (await response.json()) as T[]
    results.push(...page)
    nextUrl = parseNextLink(response.headers.get('link'))
  }

  return results
}

export type OrgMembershipState = 'active' | 'pending' | 'none'

export type OrgMembershipInfo = {
  state: OrgMembershipState
  role: 'admin' | 'member' | null
}

export async function getOrgMembershipInfo(
  username: string,
): Promise<OrgMembershipInfo> {
  const { org } = requireGitHubOrgConfig()
  const response = await githubAppFetch(`/orgs/${org}/memberships/${username}`)

  if (response.status === 404) {
    return { state: 'none', role: null }
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `GitHub org membership lookup failed (${response.status}): ${body}`,
    )
  }

  const data = (await response.json()) as { state?: string; role?: string }

  if (data.state === 'active') {
    return {
      state: 'active',
      role: data.role === 'admin' ? 'admin' : 'member',
    }
  }

  if (data.state === 'pending') {
    return { state: 'pending', role: null }
  }

  return { state: 'none', role: null }
}

export async function getOrgMembershipState(
  username: string,
): Promise<OrgMembershipState> {
  return (await getOrgMembershipInfo(username)).state
}

export async function isOrgMember(username: string): Promise<boolean> {
  return (await getOrgMembershipState(username)) === 'active'
}

export type OrgInvitationIndex = {
  byLogin: Set<string>
  byId: Set<number>
}

export function buildOrgInvitationIndex(
  invitations: OrgInvitation[],
): OrgInvitationIndex {
  const byLogin = new Set<string>()
  const byId = new Set<number>()

  for (const invitation of invitations) {
    const invitee = invitation.invitee
    if (!invitee) {
      continue
    }

    if (invitee.login) {
      byLogin.add(invitee.login.toLowerCase())
    }

    if (typeof invitee.id === 'number') {
      byId.add(invitee.id)
    }
  }

  return { byLogin, byId }
}

export function invitationIndexHas(
  index: OrgInvitationIndex,
  username: string,
  githubId: string,
): boolean {
  const numericGithubId = Number(githubId)

  return (
    index.byLogin.has(username.toLowerCase()) ||
    (Number.isFinite(numericGithubId) && index.byId.has(numericGithubId))
  )
}

export async function listPendingOrgInvitations(): Promise<OrgInvitationIndex> {
  const { org } = requireGitHubOrgConfig()
  const invitations = await githubAppFetchAllPages<OrgInvitation>(
    `/orgs/${org}/invitations`,
  )

  return buildOrgInvitationIndex(invitations)
}

export async function hasPendingOrgInvitation(
  username: string,
  githubId: string,
  invitations?: OrgInvitationIndex,
): Promise<boolean> {
  const index = invitations ?? (await listPendingOrgInvitations())
  return invitationIndexHas(index, username, githubId)
}

export type InviteUserToOrgResult =
  | 'invited'
  | 'already_member'
  | 'already_invited'

export async function inviteUserToOrg(
  githubId: number,
  username: string,
  options?: {
    knownMembershipState?: OrgMembershipState
  },
): Promise<InviteUserToOrgResult> {
  const membershipState =
    options?.knownMembershipState ?? (await getOrgMembershipState(username))

  if (membershipState === 'active') {
    return 'already_member'
  }

  if (membershipState === 'pending') {
    return 'already_invited'
  }

  const { org } = requireGitHubOrgConfig()
  const response = await githubAppFetch(`/orgs/${org}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invitee_id: githubId }),
  })

  if (response.ok || response.status === 201) {
    return 'invited'
  }

  const body = await response.text()
  const normalizedBody = body.toLowerCase()

  if (response.status === 422) {
    if (normalizedBody.includes('already a member')) {
      return 'already_member'
    }

    if (normalizedBody.includes('invitation')) {
      return 'already_invited'
    }
  }

  throw new Error(`GitHub org invitation failed (${response.status}): ${body}`)
}

export function resetInstallationTokenCache(): void {
  cachedInstallationToken = null
}
