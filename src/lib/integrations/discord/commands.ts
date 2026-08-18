import { serverConfig } from '#/lib/config'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

const CONNECT_COMMAND = {
  name: 'connect',
  description: 'Öffnet Neuland Connect zum Verknüpfen von GitHub und Discord',
  type: 1,
} as const

async function discordBotFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = serverConfig.discord.botToken
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN is not configured')
  }

  return fetch(`${DISCORD_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export async function registerDiscordSlashCommands(): Promise<void> {
  const applicationId = serverConfig.discord.clientId
  const guildId = serverConfig.discord.guildId

  if (!applicationId || !guildId) {
    throw new Error(
      'Discord slash commands need DISCORD_CLIENT_ID and DISCORD_GUILD_ID',
    )
  }

  const response = await discordBotFetch(
    `/applications/${applicationId}/guilds/${guildId}/commands`,
    {
      method: 'PUT',
      body: JSON.stringify([CONNECT_COMMAND]),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Discord slash command registration failed (${response.status}): ${body}`,
    )
  }
}
