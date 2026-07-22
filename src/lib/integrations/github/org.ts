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
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getInstallationAccessToken()

  return fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      ...GITHUB_API_HEADERS,
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
}

export type OrgMembershipState = 'active' | 'pending' | 'none'

export async function getOrgMembershipState(
  username: string,
): Promise<OrgMembershipState> {
  const { org } = requireGitHubOrgConfig()
  const response = await githubAppFetch(`/orgs/${org}/memberships/${username}`)

  if (response.status === 404) {
    return 'none'
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `GitHub org membership lookup failed (${response.status}): ${body}`,
    )
  }

  const data = (await response.json()) as { state?: string }

  if (data.state === 'active') {
    return 'active'
  }

  if (data.state === 'pending') {
    return 'pending'
  }

  return 'none'
}

export async function isOrgMember(username: string): Promise<boolean> {
  return (await getOrgMembershipState(username)) === 'active'
}

export async function hasPendingOrgInvitation(
  username: string,
  githubId: string,
): Promise<boolean> {
  const { org } = requireGitHubOrgConfig()
  const response = await githubAppFetch(`/orgs/${org}/invitations`)

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `GitHub org invitations request failed (${response.status}): ${body}`,
    )
  }

  const invitations = (await response.json()) as OrgInvitation[]
  const numericGithubId = Number(githubId)

  return invitations.some(invitation => {
    const invitee = invitation.invitee
    if (!invitee) {
      return false
    }

    return (
      invitee.login?.toLowerCase() === username.toLowerCase() ||
      invitee.id === numericGithubId
    )
  })
}

export type InviteUserToOrgResult =
  | 'invited'
  | 'already_member'
  | 'already_invited'

export async function inviteUserToOrg(
  githubId: number,
  username: string,
): Promise<InviteUserToOrgResult> {
  const membershipState = await getOrgMembershipState(username)

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
