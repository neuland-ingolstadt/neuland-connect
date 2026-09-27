import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { DiscordIcon } from '#/components/icons/discord-icon'
import { GitHubIcon } from '#/components/icons/github-icon'
import {
  type DiscordGuildStatus,
  EXTERNAL_LINKS,
  GITHUB_ORG_STATUSES,
  type GitHubOrgStatus,
  ROUTES,
} from '#/lib/constants'
import { useI18n } from '#/lib/i18n/locale-context'
import type { MessageKey } from '#/lib/i18n/messages'
import { isDiscordInGuild } from '#/lib/integrations/discord/guild-status-display'
import { githubOrgInvitationUrl } from '#/lib/integrations/github/org-status-display'
import { cn } from '#/lib/utils'

type DashboardActionBannerProps = {
  githubConnected: boolean
  githubOrgStatus: GitHubOrgStatus | null
  githubOrg: string | null
  discordConnected: boolean
  discordGuildStatus: DiscordGuildStatus | null
  nextSignedIn: boolean
}

type SetupTask = {
  id: string
  label: string
  icon: ReactNode
  complete: boolean
  actionKey: MessageKey
  href: string
  external?: boolean
}

function buildSetupTasks({
  githubConnected,
  githubOrgStatus,
  githubOrg,
  discordConnected,
  discordGuildStatus,
  nextSignedIn,
}: DashboardActionBannerProps): SetupTask[] {
  const githubInvitePending =
    githubConnected &&
    githubOrgStatus === GITHUB_ORG_STATUSES.INVITED &&
    githubOrg !== null

  const tasks: SetupTask[] = [
    {
      id: 'github',
      label: 'GitHub',
      icon: <GitHubIcon className="size-4" />,
      complete: githubConnected && !githubInvitePending,
      actionKey: githubInvitePending
        ? 'actionBanner.github.invite'
        : 'actionBanner.github.connect',
      href: githubInvitePending
        ? githubOrgInvitationUrl(githubOrg)
        : ROUTES.GITHUB_CONNECT,
      external: githubInvitePending,
    },
  ]

  const inGuild = discordConnected && isDiscordInGuild(discordGuildStatus)
  tasks.push({
    id: 'discord',
    label: 'Discord',
    icon: <DiscordIcon className="size-4" />,
    complete: inGuild,
    actionKey: discordConnected
      ? 'actionBanner.discord.join'
      : 'actionBanner.discord.connect',
    href: ROUTES.DISCORD_CONNECT,
  })

  tasks.push({
    id: 'next',
    label: 'Neuland Next',
    icon: <NeulandPalm className="size-4 text-terminal-text" />,
    complete: nextSignedIn,
    actionKey: 'actionBanner.next.install',
    href: EXTERNAL_LINKS.NEULAND_NEXT_GET,
    external: true,
  })

  return tasks
}

export function DashboardActionBanner(props: DashboardActionBannerProps) {
  const { t } = useI18n()
  const tasks = buildSetupTasks(props)
  const done = tasks.filter(task => task.complete).length

  if (done === tasks.length) {
    return null
  }

  return (
    <div className="hidden overflow-hidden border border-terminal-window-border bg-terminal-window shadow-[0_1px_0_var(--terminal-window-border)] sm:block">
      <div className="flex h-0.5">
        {tasks.map(task => (
          <div
            key={task.id}
            className={cn(
              'h-full flex-1 transition-colors',
              task.complete ? 'bg-terminal-green' : 'bg-terminal-green/15',
            )}
          />
        ))}
      </div>

      <div
        className={cn(
          'grid grid-cols-1 divide-y divide-terminal-window-border sm:divide-x sm:divide-y-0',
          tasks.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3',
        )}
      >
        {tasks.map(task =>
          task.complete ? (
            <div
              key={task.id}
              className="flex items-center gap-3 px-4 py-3.5 text-terminal-text/45"
            >
              <span className="flex size-8 shrink-0 items-center justify-center border border-terminal-window-border/60 bg-terminal-card/50 text-terminal-text/45">
                {task.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-tight">
                  {task.label}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-terminal-green">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                  {t('actionBanner.done')}
                </p>
              </div>
            </div>
          ) : (
            <a
              key={task.id}
              href={task.href}
              target={task.external ? '_blank' : undefined}
              rel={task.external ? 'noopener noreferrer' : undefined}
              className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-terminal-card/60"
            >
              <span className="flex size-8 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-card/50 text-terminal-text transition-colors group-hover:border-terminal-green/40 group-hover:text-terminal-green">
                {task.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-tight text-terminal-text">
                  {task.label}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-terminal-text/50 transition-colors group-hover:text-terminal-green">
                  {t(task.actionKey)} →
                </p>
              </div>
            </a>
          ),
        )}
      </div>
    </div>
  )
}
