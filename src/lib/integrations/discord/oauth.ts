import { generateRandomString } from '#/lib/auth/crypto'
import { serverConfig } from '#/lib/config'
import { connectStatusPath, DISCORD_OAUTH_SCOPE } from '#/lib/constants'
import { useAppSession } from '#/lib/session.server'

const DISCORD_AUTHORIZE_URL = 'https://discord.com/api/oauth2/authorize'
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token'
const DISCORD_USER_URL = 'https://discord.com/api/users/@me'

export type DiscordUser = {
  id: string
  username: string
}

function redirectResponse(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  })
}

async function startDiscordOAuth(): Promise<Response> {
  const session = await useAppSession()

  if (!session.data.user) {
    return redirectResponse('/login')
  }

  const state = generateRandomString()
  await session.update({
    ...session.data,
    discordOAuthState: state,
  })

  const params = new URLSearchParams({
    client_id: serverConfig.discord.clientId,
    redirect_uri: serverConfig.discord.redirectUri,
    response_type: 'code',
    scope: DISCORD_OAUTH_SCOPE,
    state,
  })

  return redirectResponse(`${DISCORD_AUTHORIZE_URL}?${params.toString()}`)
}

export async function initiateDiscordConnect(): Promise<Response> {
  return startDiscordOAuth()
}

async function exchangeDiscordCode(code: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: serverConfig.discord.clientId,
    client_secret: serverConfig.discord.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: serverConfig.discord.redirectUri,
  })

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error('Discord token exchange failed')
  }

  const data = (await response.json()) as {
    access_token?: string
    error?: string
  }

  if (!data.access_token) {
    throw new Error(data.error ?? 'Discord token missing in response')
  }

  return data.access_token
}

async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(DISCORD_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Discord user request failed')
  }

  const data = (await response.json()) as DiscordUser
  return { id: data.id, username: data.username }
}

export async function handleDiscordCallback(
  request: Request,
): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return redirectResponse(
      connectStatusPath({
        integration: 'discord',
        status: 'error',
        message: error,
      }),
    )
  }

  const session = await useAppSession()
  const user = session.data.user
  const expectedState = session.data.discordOAuthState

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectResponse(
      connectStatusPath({
        integration: 'discord',
        status: 'error',
        message: 'invalid_state',
      }),
    )
  }

  if (!user) {
    return redirectResponse('/login')
  }

  // Single-use: consume state before token exchange.
  await session.update({
    ...session.data,
    discordOAuthState: undefined,
  })

  try {
    const accessToken = await exchangeDiscordCode(code)
    const discordUser = await fetchDiscordUser(accessToken)
    // Token is intentionally not stored - only used during this callback.

    const { getAuthentikUser, patchAuthentikUserAttributes } = await import(
      '#/lib/authentik/client'
    )
    const { parseUserAttributes } = await import('#/lib/authentik/types')
    const { resolveSessionAuthentikUserId } = await import(
      '#/lib/authentik/session-user'
    )
    const { clearGuildMemberRoles } = await import(
      '#/lib/integrations/discord/guild'
    )
    const { postConnectDiscordSync } = await import(
      '#/lib/integrations/discord/roles-sync'
    )
    const { AUTHENTIK_ATTRIBUTES } = await import('#/lib/constants')

    const authentikUserId = await resolveSessionAuthentikUserId(user)
    const previousAuthentikUser = await getAuthentikUser(authentikUserId)
    const previousAttributes = parseUserAttributes(
      previousAuthentikUser.attributes,
    )

    if (
      previousAttributes.discordId &&
      previousAttributes.discordId !== discordUser.id
    ) {
      await clearGuildMemberRoles(previousAttributes.discordId)
    }

    await patchAuthentikUserAttributes(authentikUserId, {
      set: {
        [AUTHENTIK_ATTRIBUTES.DISCORD_USERNAME]: discordUser.username,
        [AUTHENTIK_ATTRIBUTES.DISCORD_ID]: discordUser.id,
        [AUTHENTIK_ATTRIBUTES.DISCORD_CONNECTED_AT]: new Date().toISOString(),
      },
      remove: [
        AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_STATUS,
        AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_JOINED_AT,
        AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_LAST_ERROR,
      ],
    })

    const { invalidateCurrentUserCache } = await import(
      '#/server/get-current-user'
    )
    invalidateCurrentUserCache(authentikUserId)

    void postConnectDiscordSync(
      authentikUserId,
      discordUser.id,
      accessToken,
    ).catch(syncError => {
      console.error('[discord] Post-connect guild join/sync failed:', syncError)
    })

    await session.update({
      ...session.data,
      discordOAuthState: undefined,
      user: user.authentikUserId
        ? user
        : {
            ...user,
            authentikUserId,
          },
    })

    return redirectResponse(
      connectStatusPath({ integration: 'discord', status: 'success' }),
    )
  } catch {
    return redirectResponse(
      connectStatusPath({
        integration: 'discord',
        status: 'error',
        message: 'connection_failed',
      }),
    )
  }
}
