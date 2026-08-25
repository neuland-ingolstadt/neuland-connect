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
  actionLabel: string
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
      actionLabel: githubInvitePending ? 'Einladung' : 'Verbinden',
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
    actionLabel: discordConnected ? 'Beitreten' : 'Verbinden',
    href: ROUTES.DISCORD_CONNECT,
  })

  tasks.push({
    id: 'next',
    label: 'Neuland Next',
    icon: <NeulandPalm className="size-4 text-terminal-text" />,
    complete: nextSignedIn,
    actionLabel: 'Installieren',
    href: EXTERNAL_LINKS.NEULAND_NEXT_GET,
    external: true,
  })

  return tasks
}

export function DashboardActionBanner(props: DashboardActionBannerProps) {
  const tasks = buildSetupTasks(props)
  const done = tasks.filter(task => task.complete).length

  if (done === tasks.length) {
    return null
  }

  return (
    <div className="hidden overflow-hidden border border-terminal-window-border bg-terminal-window sm:block">
      <div className="flex h-0.5">
        {tasks.map(task => (
          <div
            key={task.id}
            className={cn(
              'h-full flex-1 transition-colors',
              task.complete ? 'bg-terminal-cyan' : 'bg-terminal-cyan/15',
            )}
          />
        ))}
      </div>

      <div
        className={cn(
          'grid divide-y divide-terminal-window-border sm:divide-x sm:divide-y-0',
          tasks.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3',
        )}
      >
        {tasks.map(task =>
          task.complete ? (
            <div
              key={task.id}
              className="flex items-center gap-3 px-4 py-3.5 text-terminal-text/45"
            >
              <span className="flex size-8 shrink-0 items-center justify-center border border-terminal-window-border/50 text-terminal-text/45">
                {task.icon}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold tracking-wide">
                  {task.label}
                </p>
                <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-terminal-cyan/70">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                  Fertig
                </p>
              </div>
            </div>
          ) : (
            <a
              key={task.id}
              href={task.href}
              target={task.external ? '_blank' : undefined}
              rel={task.external ? 'noopener noreferrer' : undefined}
              className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-terminal-text/3"
            >
              <span className="flex size-8 shrink-0 items-center justify-center border border-terminal-window-border/70 text-terminal-text">
                {task.icon}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold tracking-wide text-terminal-text">
                  {task.label}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-terminal-text/50 transition-colors group-hover:text-terminal-cyan">
                  {task.actionLabel} →
                </p>
              </div>
            </a>
          ),
        )}
      </div>
    </div>
  )
}
