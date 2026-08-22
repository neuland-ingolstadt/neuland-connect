import { generateCodeChallenge, generateRandomString } from '#/lib/auth/crypto'
import type {
  OidcDiscoveryDocument,
  OidcTokenResponse,
  OidcUserInfo,
} from '#/lib/auth/types'
import {
  getAuthentikApiUserId,
  resolveAuthentikUser,
} from '#/lib/authentik/client'
import type { AuthentikUserResponse } from '#/lib/authentik/types'
import { serverConfig } from '#/lib/config'
import {
  DASHBOARD_INTRO_SEARCH,
  LOGIN_START_SEARCH,
  ROUTES,
} from '#/lib/constants'
import { useAppSession } from '#/lib/session.server'

let cachedDiscovery: OidcDiscoveryDocument | null = null

async function getOidcDiscovery(): Promise<OidcDiscoveryDocument> {
  if (cachedDiscovery) {
    return cachedDiscovery
  }

  const response = await fetch(
    `${serverConfig.authentik.issuer}/.well-known/openid-configuration`,
  )

  if (!response.ok) {
    throw new Error(
      'Authentik OIDC discovery document is unavailable. The login service may be down.',
    )
  }

  cachedDiscovery = (await response.json()) as OidcDiscoveryDocument
  return cachedDiscovery
}

function redirectResponse(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  })
}

export async function prepareOidcLogin(): Promise<string> {
  const discovery = await getOidcDiscovery()
  const state = generateRandomString()
  const codeVerifier = generateRandomString(48)
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const session = await useAppSession()

  await session.update({
    ...session.data,
    oidcState: state,
    oidcCodeVerifier: codeVerifier,
  })

  const redirectUri = `${serverConfig.appUrl}${ROUTES.AUTH_CALLBACK}`
  const params = new URLSearchParams({
    client_id: serverConfig.authentik.clientId,
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${discovery.authorization_endpoint}?${params.toString()}`
}

export async function initiateOidcLogin(): Promise<Response> {
  return redirectResponse(await prepareOidcLogin())
}

export async function handleOidcCallback(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return redirectResponse(
      `${ROUTES.LOGIN}?error=${encodeURIComponent(error)}`,
    )
  }

  const session = await useAppSession()
  const expectedState = session.data.oidcState
  const codeVerifier = session.data.oidcCodeVerifier

  // Authentik "Log back into …" uses the app launch URL. Send the user to
  // /login so the loading box can run before the next Authentik redirect.
  if (!expectedState || !codeVerifier) {
    return redirectResponse(`${ROUTES.LOGIN}?start=${LOGIN_START_SEARCH}`)
  }

  if (!code || !state || state !== expectedState) {
    return redirectResponse(`${ROUTES.LOGIN}?error=invalid_state`)
  }

  // Single-use: consume state/verifier before token exchange so parallel
  // callback replays cannot reuse the same authorization response.
  await session.update({
    ...session.data,
    oidcState: undefined,
    oidcCodeVerifier: undefined,
  })

  const discovery = await getOidcDiscovery()
  const redirectUri = `${serverConfig.appUrl}${ROUTES.AUTH_CALLBACK}`

  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: serverConfig.authentik.clientId,
      client_secret: serverConfig.authentik.clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenResponse.ok) {
    return redirectResponse(`${ROUTES.LOGIN}?error=token_exchange_failed`)
  }

  const tokens = (await tokenResponse.json()) as OidcTokenResponse

  const userInfoResponse = await fetch(discovery.userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: 'application/json',
    },
  })

  if (!userInfoResponse.ok) {
    return redirectResponse(`${ROUTES.LOGIN}?error=userinfo_failed`)
  }

  const userInfo = (await userInfoResponse.json()) as OidcUserInfo

  let authentikUser: AuthentikUserResponse
  try {
    authentikUser = await resolveAuthentikUser({
      sub: userInfo.sub,
      email: userInfo.email,
      username: userInfo.preferred_username,
    })
  } catch {
    return redirectResponse(
      `${ROUTES.LOGIN}?error=authentik_user_resolve_failed`,
    )
  }

  await session.update({
    user: {
      sub: userInfo.sub,
      authentikUserId: getAuthentikApiUserId(authentikUser),
      email: userInfo.email ?? authentikUser.email,
      name: authentikUser.name.trim() || userInfo.name || 'Mitglied',
      username: userInfo.preferred_username ?? authentikUser.username,
    },
    oidc: {
      idToken: tokens.id_token,
    },
    oidcState: undefined,
    oidcCodeVerifier: undefined,
  })

  return redirectResponse(`${ROUTES.DASHBOARD}?intro=${DASHBOARD_INTRO_SEARCH}`)
}

/**
 * Ends the Connect session, then redirects to Authentik's OIDC
 * `end_session_endpoint`. That starts the provider invalidation flow in the
 * browser. `post_logout_redirect_uri` is omitted so Authentik shows the
 * invalidation page instead of bouncing back to Connect.
 */
export async function initiateOidcLogout(): Promise<Response> {
  const session = await useAppSession()
  const idToken = session.data.oidc?.idToken
  await session.clear()

  try {
    const discovery = await getOidcDiscovery()
    const endSessionEndpoint = discovery.end_session_endpoint

    if (!endSessionEndpoint) {
      return redirectResponse(ROUTES.LOGIN)
    }

    const params = new URLSearchParams({
      client_id: serverConfig.authentik.clientId,
    })

    if (idToken) {
      params.set('id_token_hint', idToken)
    }

    return redirectResponse(`${endSessionEndpoint}?${params.toString()}`)
  } catch {
    return redirectResponse(ROUTES.LOGIN)
  }
}
