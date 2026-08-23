import { serverConfig } from '#/lib/config'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

const CONNECT_COMMAND = {
  name: 'connect',
  description: 'Öffnet Neuland Connect (Konten) zum Verknüpfen von GitHub und Discord',
  type: 1,
} as const

async function discordBotFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${DISCORD_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${serverConfig.discord.botToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export async function registerDiscordSlashCommands(): Promise<void> {
  const response = await discordBotFetch(
    `/applications/${serverConfig.discord.clientId}/guilds/${serverConfig.discord.guildId}/commands`,
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
