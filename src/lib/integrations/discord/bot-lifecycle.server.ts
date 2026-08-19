import { serverConfig } from '#/lib/config'
import { registerDiscordSlashCommands } from '#/lib/integrations/discord/commands'
import {
  startDiscordGateway,
  stopDiscordGateway,
} from '#/lib/integrations/discord/gateway'
import { ensureDiscordRoleConnectionMetadata } from '#/lib/integrations/discord/linked-roles'

let started = false

function presenceLabel(): string {
  try {
    const hostname = new URL(serverConfig.appUrl).hostname
    return hostname || 'connect.neuland.ing'
  } catch {
    return 'connect.neuland.ing'
  }
}

function isGatewayEnabled(): boolean {
  const flag = process.env.DISCORD_BOT_GATEWAY?.trim().toLowerCase()
  if (flag === 'false' || flag === '0' || flag === 'off') {
    return false
  }

  return Boolean(serverConfig.discord.botToken)
}

export async function startDiscordBot(): Promise<void> {
  if (started) {
    return
  }

  if (!serverConfig.discord.botToken) {
    return
  }

  started = true

  if (isGatewayEnabled()) {
    startDiscordGateway(serverConfig.discord.botToken, presenceLabel())
  }

  if (serverConfig.discord.isLinkedRolesConfigured) {
    try {
      await ensureDiscordRoleConnectionMetadata()
      console.log('[discord-bot] Registered Linked Roles metadata schema')
    } catch (error) {
      console.error(
        '[discord-bot] Failed to register Linked Roles metadata:',
        error,
      )
    }
  }

  if (!serverConfig.discord.isInteractionsConfigured) {
    return
  }

  try {
    await registerDiscordSlashCommands()
    console.log('[discord-bot] Registered /connect slash command')
  } catch (error) {
    console.error('[discord-bot] Failed to register slash commands:', error)
  }
}

export function stopDiscordBot(): void {
  stopDiscordGateway()
  started = false
}
