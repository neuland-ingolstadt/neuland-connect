import { Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { IntegrationProgressInline } from '#/components/dashboard/integration-progress-inline'
import { useMembershipPass } from '#/components/dashboard/membership-pass-button'
import { DiscordIcon } from '#/components/icons/discord-icon'
import { GitHubIcon } from '#/components/icons/github-icon'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { KONTEN_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'
import { getAccountSetupProgress } from '#/lib/integrations/account-setup'
import {
  firstIncompleteConnectHash,
  INTEGRATION_CARD_IDS,
  type IntegrationCardId,
} from '#/lib/integrations/connect-anchors'
import { buildDiscordIntegrationProgress } from '#/lib/integrations/discord/integration-progress'
import { buildGitHubIntegrationProgress } from '#/lib/integrations/github/integration-progress'
import { cn } from '#/lib/utils'
import type { CurrentUser } from '#/server/get-current-user'

type KontenStatusPanelProps = {
  user: CurrentUser
}

const rowClassName = cn(
  'flex w-full items-start gap-3 py-3 text-left no-underline transition-colors',
  'hover:bg-terminal-text/3 focus-visible:bg-terminal-text/3 focus-visible:outline-none',
)

export function KontenStatusPanel({ user }: KontenStatusPanelProps) {
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

  const progress = getAccountSetupProgress(user)
  const setupHash = firstIncompleteConnectHash(progress)
  const { openPass, dialog: membershipDialog } = useMembershipPass()

  return (
    <TerminalPanel title="Konten">
      <div className="space-y-4 p-4 sm:p-5">
        <ul className="divide-y divide-terminal-window-border/50">
          <StatusRow
            icon={<GitHubIcon className="size-3.5" />}
            label="GitHub"
            hint={github.hint}
            complete={github.isComplete}
            hash={INTEGRATION_CARD_IDS.github}
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
            hash={INTEGRATION_CARD_IDS.discord}
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
            hint={
              next.isComplete ? 'Mitgliedsausweis öffnen.' : next.hint
            }
            complete={next.isComplete}
            hash={INTEGRATION_CARD_IDS.membership}
            onActivate={next.isComplete ? openPass : undefined}
            progress={
              <IntegrationProgressInline
                steps={next.steps}
                isComplete={next.isComplete}
              />
            }
          />
        </ul>

        <Button
          variant={progress.allComplete ? 'outline' : 'default'}
          className="w-full"
          asChild
        >
          <Link
            to={ROUTES.CONNECT}
            search={KONTEN_SEARCH_DEFAULTS}
            hash={setupHash}
            hashScrollIntoView={{ behavior: 'smooth', block: 'start' }}
          >
            {progress.allComplete ? 'Konten verwalten' : 'Konten einrichten'}
            <ArrowRight />
          </Link>
        </Button>
      </div>
      {membershipDialog}
    </TerminalPanel>
  )
}

function StatusRow({
  icon,
  label,
  hint,
  complete,
  hash,
  progress,
  onActivate,
}: {
  icon: ReactNode
  label: string
  hint: string
  complete: boolean
  hash: IntegrationCardId
  progress: ReactNode
  onActivate?: () => void
}) {
  const content = (
    <>
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
    </>
  )

  return (
    <li>
      {onActivate ? (
        <button type="button" onClick={onActivate} className={rowClassName}>
          {content}
        </button>
      ) : (
        <Link
          to={ROUTES.CONNECT}
          search={KONTEN_SEARCH_DEFAULTS}
          hash={hash}
          hashScrollIntoView={{ behavior: 'smooth', block: 'start' }}
          className={rowClassName}
        >
          {content}
        </Link>
      )}
    </li>
  )
}
