import type { DiscordGuildStatus } from '#/lib/constants'
import { DISCORD_GUILD_STATUSES } from '#/lib/constants'

type GuildStatusBadgeVariant = 'success' | 'default' | 'muted'

export function isDiscordInGuild(status: DiscordGuildStatus | null): boolean {
  return status === DISCORD_GUILD_STATUSES.MEMBER
}

export function getDiscordGuildStatusDisplay(
  status: DiscordGuildStatus | null,
): {
  label: string
  variant: GuildStatusBadgeVariant
} {
  switch (status) {
    case 'member':
      return { label: 'Im Server', variant: 'success' }
    default:
      return { label: 'Noch nicht im Server', variant: 'muted' }
  }
}

export function discordProfileUrl(discordUserId: string): string {
  return `https://discord.com/users/${discordUserId}`
}
