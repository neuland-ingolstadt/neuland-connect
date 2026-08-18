import { generateRandomString } from '#/lib/auth/crypto'
import type { AuthentikUserResponse } from '#/lib/authentik/types'
import { serverConfig } from '#/lib/config'
import {
  DISCORD_LINKED_ROLE_OAUTH_SCOPE,
  DISCORD_OAUTH_SCOPE,
} from '#/lib/constants'
import { useAppSession } from '#/lib/session.server'
import type { SessionData } from '#/lib/session-types'

const DISCORD_AUTHORIZE_URL = 'https://discord.com/api/oauth2/authorize'
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token'
const DISCORD_USER_URL = 'https://discord.com/api/users/@me'

export type DiscordUser = {
  id: string
  username: string
}

type DiscordOAuthPurpose = NonNullable<SessionData['discordOAuthPurpose']>

function redirectResponse(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  })
}

async function startDiscordOAuth(options: {
  purpose: DiscordOAuthPurpose
  scope: string
  requireSessionUser: boolean
}): Promise<Response> {
  if (!serverConfig.discord.isOAuthConfigured) {
    return redirectResponse(
      '/dashboard?integration=discord&status=error&message=not_configured',
    )
  }

  const session = await useAppSession()

  if (options.requireSessionUser && !session.data.user) {
    return redirectResponse('/login')
  }

  const clientId = serverConfig.discord.clientId
  const clientSecret = serverConfig.discord.clientSecret
  if (!clientId || !clientSecret) {
    throw new Error('Discord OAuth is not configured')
  }

  const state = generateRandomString()
  await session.update({
    ...session.data,
    discordOAuthState: state,
    discordOAuthPurpose: options.purpose,
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: serverConfig.discord.redirectUri,
    response_type: 'code',
    scope: options.scope,
    state,
  })

  return redirectResponse(`${DISCORD_AUTHORIZE_URL}?${params.toString()}`)
}

export async function initiateDiscordConnect(): Promise<Response> {
  return startDiscordOAuth({
    purpose: 'connect',
    scope: DISCORD_OAUTH_SCOPE,
    requireSessionUser: true,
  })
}

/**
 * Discord Developer Portal → Linked Roles Verification URL.
 * Starts OAuth with `role_connections.write`; no Connect login required.
 */
export async function initiateDiscordLinkedRole(): Promise<Response> {
  return startDiscordOAuth({
    purpose: 'linked_role',
    scope: DISCORD_LINKED_ROLE_OAUTH_SCOPE,
    requireSessionUser: false,
  })
}

async function exchangeDiscordCode(code: string): Promise<string> {
  const clientId = serverConfig.discord.clientId
  const clientSecret = serverConfig.discord.clientSecret
  if (!clientId || !clientSecret) {
    throw new Error('Discord OAuth is not configured')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
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

async function writeLinkedRoleBestEffort(
  accessToken: string,
  discordUsername: string,
  authentikUser: AuthentikUserResponse | null,
): Promise<void> {
  if (!serverConfig.discord.isLinkedRolesConfigured) {
    return
  }

  const {
    writeEmptyDiscordRoleConnection,
    writeRoleConnectionForAuthentikUser,
  } = await import('#/lib/integrations/discord/linked-roles')

  try {
    if (authentikUser) {
      await writeRoleConnectionForAuthentikUser(accessToken, authentikUser)
      return
    }

    await writeEmptyDiscordRoleConnection(accessToken, discordUsername)
  } catch (error) {
    console.error('[discord] Linked Role write failed:', error)
  }
}

async function handleLinkedRoleCallback(
  accessToken: string,
  discordUser: DiscordUser,
): Promise<Response> {
  const session = await useAppSession()
  const hasConnectSession = Boolean(session.data.user)
  const { findAuthentikUserByDiscordId } = await import(
    '#/lib/authentik/client'
  )

  const authentikUser = await findAuthentikUserByDiscordId(discordUser.id)
  await writeLinkedRoleBestEffort(
    accessToken,
    discordUser.username,
    authentikUser,
  )

  await session.update({
    ...session.data,
    discordOAuthState: undefined,
    discordOAuthPurpose: undefined,
  })

  if (!authentikUser) {
    if (hasConnectSession) {
      return redirectResponse(
        '/dashboard?integration=discord&status=not_linked',
      )
    }

    return redirectResponse('/login')
  }

  if (hasConnectSession) {
    return redirectResponse('/dashboard?integration=discord&status=linked_role')
  }

  return redirectResponse('/login')
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
      `/dashboard?integration=discord&status=error&message=${encodeURIComponent(error)}`,
    )
  }

  const session = await useAppSession()
  const user = session.data.user
  const purpose = session.data.discordOAuthPurpose ?? 'connect'

  if (!code || !state || state !== session.data.discordOAuthState) {
    return redirectResponse(
      '/dashboard?integration=discord&status=error&message=invalid_state',
    )
  }

  try {
    const accessToken = await exchangeDiscordCode(code)
    const discordUser = await fetchDiscordUser(accessToken)
    // Token is intentionally not stored - only used during this callback.

    if (purpose === 'linked_role') {
      return handleLinkedRoleCallback(accessToken, discordUser)
    }

    if (!user) {
      return redirectResponse('/login')
    }

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
      previousAttributes.discordId !== discordUser.id &&
      serverConfig.discord.isRoleSyncConfigured
    ) {
      await clearGuildMemberRoles(previousAttributes.discordId)
    }

    const linkedAuthentikUser = await patchAuthentikUserAttributes(
      authentikUserId,
      {
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
      },
    )

    void writeLinkedRoleBestEffort(
      accessToken,
      discordUser.username,
      linkedAuthentikUser,
    )

    if (serverConfig.discord.isRoleSyncConfigured) {
      void postConnectDiscordSync(
        authentikUserId,
        discordUser.id,
        accessToken,
      ).catch(syncError => {
        console.error(
          '[discord] Post-connect guild join/sync failed:',
          syncError,
        )
      })
    }

    await session.update({
      ...session.data,
      discordOAuthState: undefined,
      discordOAuthPurpose: undefined,
      user: user.authentikUserId
        ? user
        : {
            ...user,
            authentikUserId,
          },
    })

    return redirectResponse('/dashboard?integration=discord&status=success')
  } catch {
    return redirectResponse(
      '/dashboard?integration=discord&status=error&message=connection_failed',
    )
  }
}
