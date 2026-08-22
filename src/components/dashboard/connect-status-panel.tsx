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

  const { doneCount, totalCount, allComplete } = getConnectSetupProgress(user)

  return (
    <TerminalPanel
      title="Connect"
      subtitle={`${doneCount}/${totalCount} eingerichtet`}
    >
      <div className="space-y-4 p-4 sm:p-5">
        <ul className="space-y-2.5">
          <StatusRow
            icon={<GitHubIcon className="size-4" />}
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
            icon={<DiscordIcon className="size-4" />}
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
            icon={<NeulandPalm className="size-4 text-terminal-text" />}
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
          'flex items-start gap-3 border border-terminal-window-border bg-terminal-card px-3 py-2.5 no-underline transition-colors',
          'hover:border-terminal-cyan/40 hover:bg-terminal-window focus-visible:border-terminal-cyan/40 focus-visible:outline-none',
        )}
      >
        <span
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center border',
            complete
              ? 'border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-text'
              : 'border-terminal-window-border bg-terminal-bg text-terminal-text',
          )}
        >
          {complete ? (
            <Check className="size-3.5 text-terminal-cyan" strokeWidth={2.5} />
          ) : (
            icon
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-xs font-semibold tracking-wide text-terminal-text">
              {label}
            </p>
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
