import type { DiscordGuildStatus } from '#/lib/constants'
import type { Locale } from '#/lib/i18n/messages'
import { translate } from '#/lib/i18n/messages'
import { isDiscordInGuild } from '#/lib/integrations/discord/guild-status-display'

export type IntegrationProgressStep = {
  id: string
  label: string
  complete: boolean
}

type BuildDiscordIntegrationProgressInput = {
  connected: boolean
  discordGuildStatus: DiscordGuildStatus | null
}

export function buildDiscordIntegrationProgress(
  input: BuildDiscordIntegrationProgressInput,
  locale: Locale = 'de',
): {
  steps: IntegrationProgressStep[]
  hint: string
  isComplete: boolean
} {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const inGuild = isDiscordInGuild(input.discordGuildStatus)

  const steps: IntegrationProgressStep[] = [
    {
      id: 'connected',
      label: t('discord.progress.connected'),
      complete: input.connected,
    },
    {
      id: 'in-guild',
      label: t('discord.progress.server'),
      complete: inGuild,
    },
    {
      id: 'roles',
      label: t('discord.progress.roles'),
      complete: inGuild,
    },
  ]

  let hint: string

  if (!input.connected) {
    hint = t('discord.hint.connect')
  } else if (!inGuild) {
    hint = t('discord.hint.join')
  } else {
    hint = t('discord.hint.done')
  }

  return {
    steps,
    hint,
    isComplete: input.connected && inGuild,
  }
}
