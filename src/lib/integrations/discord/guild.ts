import { serverConfig } from '#/lib/config'

const DISCORD_API_BASE = 'https://discord.com/api/v10'
const MAX_RATE_LIMIT_RETRIES = 5
const MAX_RETRY_AFTER_MS = 30_000
const DEFAULT_RETRY_AFTER_MS = 1_000

export type DiscordGuildMember = {
  user?: {
    id: string
    username: string
  }
  roles: string[]
}

export type DiscordGuildRole = {
  id: string
  name: string
  position: number
  managed: boolean
}

class DiscordApiError extends Error {
  constructor(
    readonly status: number,
    message?: string,
    readonly code?: number,
  ) {
    super(message ?? `Discord API error (${status})`)
    this.name = 'DiscordApiError'
  }
}

/** Discord API error code: Unknown Role */
export const DISCORD_ERROR_UNKNOWN_ROLE = 10011

function clampRetryAfterMs(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_RETRY_AFTER_MS
  }

  return Math.min(value, MAX_RETRY_AFTER_MS)
}

function parseRetryAfterHeader(response: Response): number | null {
  const retryAfter = response.headers.get('Retry-After')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds)) {
      return clampRetryAfterMs(seconds * 1000)
    }

    const dateMs = Date.parse(retryAfter)
    if (!Number.isNaN(dateMs)) {
      return clampRetryAfterMs(dateMs - Date.now())
    }
  }

  const resetAfter = response.headers.get('X-RateLimit-Reset-After')
  if (resetAfter) {
    const seconds = Number(resetAfter)
    if (Number.isFinite(seconds)) {
      return clampRetryAfterMs(seconds * 1000)
    }
  }

  return null
}

async function readDiscordErrorBody(
  response: Response,
): Promise<{ message?: string; code?: number; retryAfterMs?: number }> {
  try {
    const data = (await response.json()) as {
      message?: string
      code?: number
      retry_after?: number
    }
    const message = data.message
      ? data.code
        ? `${data.message} (code ${data.code})`
        : data.message
      : undefined
    const retryAfterMs =
      typeof data.retry_after === 'number'
        ? clampRetryAfterMs(data.retry_after * 1000)
        : undefined

    return {
      message,
      code: typeof data.code === 'number' ? data.code : undefined,
      retryAfterMs,
    }
  } catch {
    return {}
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function discordApiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const botToken = serverConfig.discord.botToken

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    const response = await fetch(`${DISCORD_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bot ${botToken}`,
        Accept: 'application/json',
        ...init?.headers,
      },
    })

    if (response.status !== 429 || attempt === MAX_RATE_LIMIT_RETRIES) {
      return response
    }

    const headerWait = parseRetryAfterHeader(response)
    if (headerWait !== null) {
      await response.arrayBuffer()
      await sleep(headerWait)
      continue
    }

    const body = await readDiscordErrorBody(response)
    await sleep(body.retryAfterMs ?? DEFAULT_RETRY_AFTER_MS)
  }

  throw new DiscordApiError(429, 'Discord rate limit exceeded')
}

async function discordBotFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await discordApiFetch(path, init)

  if (!response.ok) {
    const { message, code } = await readDiscordErrorBody(response)
    throw new DiscordApiError(
      response.status,
      message ? `Discord API ${response.status}: ${message}` : undefined,
      code,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function listGuildRoles(): Promise<DiscordGuildRole[]> {
  const guildId = serverConfig.discord.guildId

  const roles = await discordBotFetch<DiscordGuildRole[]>(
    `/guilds/${guildId}/roles`,
  )

  return roles.sort((a, b) => b.position - a.position)
}

export async function getGuildMember(
  discordUserId: string,
): Promise<DiscordGuildMember | null> {
  const guildId = serverConfig.discord.guildId

  const response = await discordApiFetch(
    `/guilds/${guildId}/members/${discordUserId}`,
  )

  if (response.status === 404) {
    await response.arrayBuffer()
    return null
  }

  if (!response.ok) {
    const { message, code } = await readDiscordErrorBody(response)
    throw new DiscordApiError(
      response.status,
      message ? `Discord API ${response.status}: ${message}` : undefined,
      code,
    )
  }

  return response.json() as Promise<DiscordGuildMember>
}

export type GuildJoinResult = 'joined' | 'already_member'

/**
 * Add a user to the guild using their OAuth access token (`guilds.join` scope).
 * Requires bot authorization on the request.
 */
export async function addGuildMember(
  discordUserId: string,
  userAccessToken: string,
): Promise<GuildJoinResult> {
  const guildId = serverConfig.discord.guildId

  const response = await discordApiFetch(
    `/guilds/${guildId}/members/${discordUserId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: userAccessToken }),
    },
  )

  if (response.status === 201) {
    await response.arrayBuffer()
    return 'joined'
  }

  if (response.status === 204) {
    return 'already_member'
  }

  const { message, code } = await readDiscordErrorBody(response)
  throw new DiscordApiError(response.status, message, code)
}

export async function addGuildMemberRole(
  discordUserId: string,
  roleId: string,
): Promise<void> {
  const guildId = serverConfig.discord.guildId

  await discordBotFetch(
    `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    { method: 'PUT' },
  )
}

export async function removeGuildMemberRole(
  discordUserId: string,
  roleId: string,
): Promise<void> {
  const guildId = serverConfig.discord.guildId

  await discordBotFetch(
    `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    { method: 'DELETE' },
  )
}

/**
 * Keep the member in the guild, but drop every assignable role.
 * Roles the bot cannot manage (hierarchy / integration) are skipped.
 */
export async function clearGuildMemberRoles(
  discordUserId: string,
): Promise<void> {
  const member = await getGuildMember(discordUserId)
  if (!member || member.roles.length === 0) {
    return
  }

  try {
    await setGuildMemberRoles(discordUserId, [])
    return
  } catch (error) {
    if (!(error instanceof DiscordApiError)) {
      throw error
    }
  }

  for (const roleId of member.roles) {
    try {
      await removeGuildMemberRole(discordUserId, roleId)
    } catch (error) {
      if (
        error instanceof DiscordApiError &&
        (error.status === 400 || error.status === 403 || error.status === 404)
      ) {
        continue
      }

      throw error
    }
  }
}

async function setGuildMemberRoles(
  discordUserId: string,
  roleIds: string[],
): Promise<void> {
  const guildId = serverConfig.discord.guildId

  await discordBotFetch(`/guilds/${guildId}/members/${discordUserId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roles: roleIds }),
  })
}

export type DiscordChannelMessage = {
  id: string
  content: string
  author?: {
    id: string
    bot?: boolean
  }
  embeds?: Array<{
    url?: string
    footer?: {
      text?: string
    }
  }>
}

export type DiscordCreateMessageBody = {
  content?: string
  embeds?: Array<{
    title?: string
    description?: string
    url?: string
    color?: number
    fields?: Array<{
      name: string
      value: string
      inline?: boolean
    }>
    footer?: {
      text: string
    }
  }>
  components?: Array<{
    type: number
    components: Array<{
      type: number
      style?: number
      label?: string
      url?: string
    }>
  }>
}

export async function listChannelMessages(
  channelId: string,
  limit = 50,
): Promise<DiscordChannelMessage[]> {
  const capped = Math.min(Math.max(limit, 1), 100)
  return discordBotFetch<DiscordChannelMessage[]>(
    `/channels/${channelId}/messages?limit=${capped}`,
  )
}

export async function createChannelMessage(
  channelId: string,
  body: DiscordCreateMessageBody,
): Promise<DiscordChannelMessage> {
  return discordBotFetch<DiscordChannelMessage>(
    `/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
}

export { DiscordApiError }
