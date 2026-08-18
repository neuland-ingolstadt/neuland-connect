import type { DiscordGuildStatus } from '#/lib/constants'
import { isDiscordInGuild } from '#/lib/integrations/discord/guild-status-display'

export type IntegrationProgressStep = {
  id: string
  label: string
  complete: boolean
}

type BuildDiscordIntegrationProgressInput = {
  connected: boolean
  discordGuildStatus: DiscordGuildStatus | null
  roleSyncEnabled: boolean
}

export function buildDiscordIntegrationProgress(
  input: BuildDiscordIntegrationProgressInput,
): {
  steps: IntegrationProgressStep[]
  hint: string
  isComplete: boolean
} {
  const inGuild = isDiscordInGuild(input.discordGuildStatus)

  const steps: IntegrationProgressStep[] = [
    {
      id: 'connected',
      label: 'Verbunden',
      complete: input.connected,
    },
    {
      id: 'in-guild',
      label: 'Server',
      complete: inGuild,
    },
  ]

  if (input.roleSyncEnabled) {
    steps.push({
      id: 'roles',
      label: 'Rollen',
      complete: inGuild,
    })
  }

  let hint: string

  if (!input.connected) {
    hint = 'Discord-Konto verbinden.'
  } else if (!inGuild) {
    hint = 'Discord erneut verbinden, um dem Server beizutreten.'
  } else if (input.roleSyncEnabled) {
    hint = 'Im Server – Rollen werden synchronisiert.'
  } else {
    hint = 'Im Server.'
  }

  return {
    steps,
    hint,
    isComplete: input.connected && inGuild,
  }
}
