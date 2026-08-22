import { Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { IntegrationProgressInline } from '#/components/dashboard/integration-progress-inline'
import { DiscordIcon } from '#/components/icons/discord-icon'
import { GitHubIcon } from '#/components/icons/github-icon'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { CONNECT_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'
import { getConnectSetupProgress } from '#/lib/integrations/connect-setup'
import { buildDiscordIntegrationProgress } from '#/lib/integrations/discord/integration-progress'
import { buildGitHubIntegrationProgress } from '#/lib/integrations/github/integration-progress'
import { cn } from '#/lib/utils'
import type { CurrentUser } from '#/server/get-current-user'

type ConnectStatusPanelProps = {
  user: CurrentUser
}

export function ConnectStatusPanel({ user }: ConnectStatusPanelProps) {
  const github = buildGitHubIntegrationProgress({
    connected: user.githubConnected,
    githubOrgStatus: user.attributes.githubOrgStatus,
    teamSyncEnabled: user.teamSyncEnabled,
  })
  const discord = buildDiscordIntegrationProgress({
    connected: user.discordConnected,
    discordGuildStatus: user.attributes.discordGuildStatus,
  })
  const next = {
    steps: [
      {
        id: 'next-session',
        label: 'Angemeldet',
        complete: user.nextSession.signedIn,
      },
    ],
    hint: user.nextSession.signedIn
      ? 'Mitgliedsausweis ist aktiv.'
      : 'In der App mit dem Neuland-Konto anmelden.',
    isComplete: user.nextSession.signedIn,
  }

  const { allComplete } = getConnectSetupProgress(user)

  return (
    <TerminalPanel title="Connect">
      <div className="space-y-4 p-4 sm:p-5">
        <ul className="divide-y divide-terminal-window-border/50">
          <StatusRow
            icon={<GitHubIcon className="size-3.5" />}
            label="GitHub"
            hint={github.hint}
            complete={github.isComplete}
            progress={
              <IntegrationProgressInline
                steps={github.steps}
                isComplete={github.isComplete}
              />
            }
          />
          <StatusRow
            icon={<DiscordIcon className="size-3.5" />}
            label="Discord"
            hint={discord.hint}
            complete={discord.isComplete}
            progress={
              <IntegrationProgressInline
                steps={discord.steps}
                isComplete={discord.isComplete}
              />
            }
          />
          <StatusRow
            icon={<NeulandPalm className="size-3.5 text-terminal-text" />}
            label="Neuland Next"
            hint={next.hint}
            complete={next.isComplete}
            progress={
              <IntegrationProgressInline
                steps={next.steps}
                isComplete={next.isComplete}
              />
            }
          />
        </ul>

        <Button
          variant={allComplete ? 'outline' : 'default'}
          className="w-full"
          asChild
        >
          <Link to={ROUTES.CONNECT} search={CONNECT_SEARCH_DEFAULTS}>
            {allComplete ? 'Konten verwalten' : 'Konten einrichten'}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </TerminalPanel>
  )
}

function StatusRow({
  icon,
  label,
  hint,
  complete,
  progress,
}: {
  icon: ReactNode
  label: string
  hint: string
  complete: boolean
  progress: ReactNode
}) {
  return (
    <li>
      <Link
        to={ROUTES.CONNECT}
        search={CONNECT_SEARCH_DEFAULTS}
        className={cn(
          'flex items-start gap-3 py-3 no-underline transition-colors',
          'hover:bg-terminal-text/3 focus-visible:bg-terminal-text/3 focus-visible:outline-none',
        )}
      >
        <span
          className={cn(
            'mt-0.5 flex size-7 shrink-0 items-center justify-center',
            complete
              ? 'border border-terminal-cyan/25 bg-terminal-cyan/8 text-terminal-cyan'
              : 'border border-terminal-window-border/70 text-terminal-text/70',
          )}
        >
          {complete ? <Check className="size-3.5" strokeWidth={2.5} /> : icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-terminal-text">{label}</p>
            {progress}
          </div>
          <p className="mt-0.5 text-xs leading-snug text-terminal-text/50">
            {hint}
          </p>
        </div>
      </Link>
    </li>
  )
}
