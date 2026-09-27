import type { DiscordGuildStatus } from '#/lib/constants'
import { DISCORD_GUILD_STATUSES } from '#/lib/constants'
import type { Locale } from '#/lib/i18n/messages'
import { translate } from '#/lib/i18n/messages'

type GuildStatusBadgeVariant = 'success' | 'default' | 'muted'

export function isDiscordInGuild(status: DiscordGuildStatus | null): boolean {
  return status === DISCORD_GUILD_STATUSES.MEMBER
}

export function getDiscordGuildStatusDisplay(
  status: DiscordGuildStatus | null,
  locale: Locale = 'de',
): {
  label: string
  variant: GuildStatusBadgeVariant
} {
  switch (status) {
    case 'member':
      return {
        label: translate(locale, 'discord.status.member'),
        variant: 'success',
      }
    default:
      return {
        label: translate(locale, 'discord.status.pending'),
        variant: 'muted',
      }
  }
}

export function discordProfileUrl(discordUserId: string): string {
  return `https://discord.com/users/${discordUserId}`
}
