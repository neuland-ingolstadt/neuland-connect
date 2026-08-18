import { ArrowRight } from 'lucide-react'
import {
  type DiscordGuildStatus,
  GITHUB_ORG_STATUSES,
  type GitHubOrgStatus,
  ROUTES,
} from '#/lib/constants'
import { isDiscordInGuild } from '#/lib/integrations/discord/guild-status-display'
import { githubOrgInvitationUrl } from '#/lib/integrations/github/org-status-display'

const GITHUB_CARD_ID = 'integration-github'
const DISCORD_CARD_ID = 'integration-discord'

type DashboardActionBannerProps = {
  githubConnected: boolean
  githubOrgStatus: GitHubOrgStatus | null
  githubOrg: string | null
  discordOAuthEnabled: boolean
  discordConnected: boolean
  discordGuildStatus: DiscordGuildStatus | null
}

type ActionItem = {
  id: string
  message: string
  actionLabel: string
  href: string
  external?: boolean
  footnote?: string
}

function buildActionItems({
  githubConnected,
  githubOrgStatus,
  githubOrg,
  discordOAuthEnabled,
  discordConnected,
  discordGuildStatus,
}: DashboardActionBannerProps): ActionItem[] {
  const items: ActionItem[] = []

  if (!githubConnected) {
    items.push({
      id: 'github-connect',
      message: 'GitHub ist noch nicht verbunden.',
      actionLabel: 'GitHub verbinden',
      href: `#${GITHUB_CARD_ID}`,
    })
  } else if (
    githubOrgStatus === GITHUB_ORG_STATUSES.INVITED &&
    githubOrg !== null
  ) {
    items.push({
      id: 'github-invite',
      message: 'GitHub-Org-Einladung wartet auf Annahme.',
      actionLabel: 'Einladung annehmen',
      href: githubOrgInvitationUrl(githubOrg),
      external: true,
      footnote:
        'Statusaktualisierung automatisch, kann bis zu 20 Minuten dauern.',
    })
  }

  if (discordOAuthEnabled) {
    if (!discordConnected) {
      items.push({
        id: 'discord-connect',
        message: 'Discord ist noch nicht verbunden.',
        actionLabel: 'Discord verbinden',
        href: `#${DISCORD_CARD_ID}`,
      })
    } else if (!isDiscordInGuild(discordGuildStatus)) {
      items.push({
        id: 'discord-guild',
        message: 'Du bist noch nicht im Neuland-Discord-Server.',
        actionLabel: 'Erneut beitreten',
        href: ROUTES.DISCORD_CONNECT,
      })
    }
  }

  return items
}

export function DashboardActionBanner(props: DashboardActionBannerProps) {
  const items = buildActionItems(props)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="border-l-2 border-terminal-cyan/50 bg-terminal-card/30 px-3 py-1.5">
      <ul className="divide-y divide-terminal-window-border/50">
        {items.map(item => (
          <li
            key={item.id}
            className="flex flex-col gap-1 py-1 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          >
            <div className="min-w-0">
              <p className="font-mono text-[11px] text-terminal-text/75">
                {item.message}
              </p>
              {item.footnote ? (
                <p className="mt-0.5 font-mono text-[10px] leading-snug text-terminal-text/35">
                  {item.footnote}
                </p>
              ) : null}
            </div>
            <a
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-terminal-cyan transition-colors hover:text-terminal-lightGreen"
            >
              {item.actionLabel}
              <ArrowRight className="size-3" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const INTEGRATION_CARD_IDS = {
  github: GITHUB_CARD_ID,
  discord: DISCORD_CARD_ID,
} as const
