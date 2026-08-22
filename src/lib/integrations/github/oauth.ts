import { generateRandomString } from '#/lib/auth/crypto'
import { serverConfig } from '#/lib/config'
import { connectStatusPath, GITHUB_OAUTH_SCOPE } from '#/lib/constants'
import { useAppSession } from '#/lib/session.server'

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USER_URL = 'https://api.github.com/user'

export type GitHubUser = {
  id: number
  login: string
}

function redirectResponse(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  })
}

export async function initiateGitHubConnect(): Promise<Response> {
  const session = await useAppSession()

  if (!session.data.user) {
    return redirectResponse('/login')
  }

  const state = generateRandomString()
  await session.update({
    ...session.data,
    githubOAuthState: state,
  })

  const params = new URLSearchParams({
    client_id: serverConfig.github.clientId,
    redirect_uri: serverConfig.github.redirectUri,
    scope: GITHUB_OAUTH_SCOPE,
    state,
  })

  return redirectResponse(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`)
}

async function exchangeGitHubCode(code: string): Promise<string> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: serverConfig.github.clientId,
      client_secret: serverConfig.github.clientSecret,
      code,
      redirect_uri: serverConfig.github.redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error('GitHub token exchange failed')
  }

  const data = (await response.json()) as {
    access_token?: string
    error?: string
  }

  if (!data.access_token) {
    throw new Error(data.error ?? 'GitHub token missing in response')
  }

  return data.access_token
}

async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    throw new Error('GitHub user request failed')
  }

  const data = (await response.json()) as GitHubUser
  return { id: data.id, login: data.login }
}

export async function handleGitHubCallback(
  request: Request,
): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return redirectResponse(
      connectStatusPath({
        integration: 'github',
        status: 'error',
        message: error,
      }),
    )
  }

  const session = await useAppSession()
  const user = session.data.user

  if (!user) {
    return redirectResponse('/login')
  }

  const expectedState = session.data.githubOAuthState
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectResponse(
      connectStatusPath({
        integration: 'github',
        status: 'error',
        message: 'invalid_state',
      }),
    )
  }

  // Single-use: consume state before token exchange.
  await session.update({
    ...session.data,
    githubOAuthState: undefined,
  })

  try {
    const accessToken = await exchangeGitHubCode(code)
    const githubUser = await fetchGitHubUser(accessToken)
    // Token is intentionally not stored - only used for the API call above.

    const { getAuthentikUser, patchAuthentikUserAttributes } = await import(
      '#/lib/authentik/client'
    )
    const { parseUserAttributes } = await import('#/lib/authentik/types')
    const { resolveSessionAuthentikUserId } = await import(
      '#/lib/authentik/session-user'
    )
    const { clearManagedGitHubTeams } = await import(
      '#/lib/integrations/github/teams-sync'
    )
    const { enqueueOrgInvite } = await import('#/lib/integrations/github/sync')
    const { AUTHENTIK_ATTRIBUTES } = await import('#/lib/constants')

    const authentikUserId = await resolveSessionAuthentikUserId(user)
    const previousAttributes = parseUserAttributes(
      (await getAuthentikUser(authentikUserId)).attributes,
    )
    const newGitHubId = String(githubUser.id)

    if (
      previousAttributes.githubUsername &&
      previousAttributes.githubId &&
      previousAttributes.githubId !== newGitHubId &&
      serverConfig.github.isTeamSyncConfigured
    ) {
      await clearManagedGitHubTeams(previousAttributes.githubUsername)
    }

    await patchAuthentikUserAttributes(authentikUserId, {
      set: {
        [AUTHENTIK_ATTRIBUTES.GITHUB_USERNAME]: githubUser.login,
        [AUTHENTIK_ATTRIBUTES.GITHUB_ID]: String(githubUser.id),
        [AUTHENTIK_ATTRIBUTES.GITHUB_CONNECTED_AT]: new Date().toISOString(),
      },
      remove: [
        AUTHENTIK_ATTRIBUTES.GITHUB_ORG_STATUS,
        AUTHENTIK_ATTRIBUTES.GITHUB_ORG_INVITED_AT,
        AUTHENTIK_ATTRIBUTES.GITHUB_ORG_LAST_ERROR,
      ],
    })

    const { invalidateCurrentUserCache } = await import(
      '#/server/get-current-user'
    )
    invalidateCurrentUserCache(authentikUserId)

    enqueueOrgInvite(authentikUserId, githubUser.login, newGitHubId)

    await session.update({
      ...session.data,
      githubOAuthState: undefined,
      user: user.authentikUserId
        ? user
        : {
            ...user,
            authentikUserId,
          },
    })

    return redirectResponse(
      connectStatusPath({ integration: 'github', status: 'success' }),
    )
  } catch {
    return redirectResponse(
      connectStatusPath({
        integration: 'github',
        status: 'error',
        message: 'connection_failed',
      }),
    )
  }
}
