import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { IntegrationOverflowMenu } from '#/components/dashboard/integration-overflow-menu'
import { IntegrationProgressInline } from '#/components/dashboard/integration-progress-inline'
import { GitHubIcon } from '#/components/icons/github-icon'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import type { UserAttributes } from '#/lib/authentik/types'
import { GITHUB_ORG_STATUSES, ROUTES } from '#/lib/constants'
import { useI18n } from '#/lib/i18n/locale-context'
import { localeToDateLocale } from '#/lib/i18n/messages'
import { INTEGRATION_CARD_IDS } from '#/lib/integrations/connect-anchors'
import { buildGitHubIntegrationProgress } from '#/lib/integrations/github/integration-progress'
import {
  getGitHubOrgStatusDisplay,
  githubOrgInvitationUrl,
  githubProfileUrl,
} from '#/lib/integrations/github/org-status-display'
import { formatDate } from '#/lib/utils'
import { disconnectGitHubFn } from '#/server/disconnect-github'
import { syncGitHubTeamsFn } from '#/server/sync-github-teams'

const VISIBLE_TEAM_LIMIT = 4

type GitHubConnectionCardProps = {
  connected: boolean
  attributes: UserAttributes
  githubOrg: string | null
  teamSyncEnabled: boolean
  githubTeams: string[]
}

export function GitHubConnectionCard({
  connected,
  attributes,
  githubOrg,
  teamSyncEnabled,
  githubTeams,
}: GitHubConnectionCardProps) {
  const router = useRouter()
  const disconnectGitHub = useServerFn(disconnectGitHubFn)
  const syncGitHubTeams = useServerFn(syncGitHubTeamsFn)
  const { t, locale } = useI18n()
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSyncingTeams, setIsSyncingTeams] = useState(false)
  const [teamsExpanded, setTeamsExpanded] = useState(false)
  const orgStatus = getGitHubOrgStatusDisplay(
    attributes.githubOrgStatus,
    locale,
  )
  const hasMoreTeams = githubTeams.length > VISIBLE_TEAM_LIMIT
  const visibleTeams =
    teamsExpanded || !hasMoreTeams
      ? githubTeams
      : githubTeams.slice(0, VISIBLE_TEAM_LIMIT)
  const hiddenTeamCount = githubTeams.length - visibleTeams.length
  const showInvitationLink =
    connected && attributes.githubOrgStatus === 'invited' && githubOrg !== null
  const canSyncTeams =
    connected &&
    teamSyncEnabled &&
    (attributes.githubOrgStatus === GITHUB_ORG_STATUSES.MEMBER ||
      attributes.githubOrgStatus === GITHUB_ORG_STATUSES.ADMIN)
  const integrationProgress = buildGitHubIntegrationProgress(
    {
      connected,
      githubOrgStatus: attributes.githubOrgStatus,
      teamSyncEnabled,
    },
    locale,
  )

  async function handleDisconnect() {
    setIsDisconnecting(true)

    try {
      await disconnectGitHub()
      toast.success(t('toast.github.disconnected'))
      setDisconnectOpen(false)
      await router.invalidate()
    } catch {
      toast.error(t('toast.github.disconnectError'))
    } finally {
      setIsDisconnecting(false)
    }
  }

  async function handleSyncTeams() {
    setIsSyncingTeams(true)

    try {
      const result = await syncGitHubTeams()
      const parts: string[] = []
      if (result.added.length > 0) {
        parts.push(`+${result.added.join(', ')}`)
      }
      if (result.removed.length > 0) {
        parts.push(`−${result.removed.join(', ')}`)
      }
      toast.success(
        parts.length > 0
          ? t('toast.github.teamsUpdated', { parts: parts.join('; ') })
          : t('toast.github.teamsCurrent'),
      )
      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('toast.github.teamsSyncError'),
      )
    } finally {
      setIsSyncingTeams(false)
    }
  }

  const dateLocale = localeToDateLocale(locale)
  return (
    <TerminalPanel
      id={INTEGRATION_CARD_IDS.github}
      className="scroll-mt-24"
      title="GitHub"
      titleAside={
        <IntegrationProgressInline
          steps={integrationProgress.steps}
          isComplete={integrationProgress.isComplete}
        />
      }
    >
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-card/60">
              <GitHubIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold tracking-tight text-terminal-text">
                {connected && attributes.githubUsername ? (
                  <a
                    href={githubProfileUrl(attributes.githubUsername)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-terminal-green"
                  >
                    @{attributes.githubUsername}
                  </a>
                ) : (
                  t('github.card.join')
                )}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-terminal-text/55">
                {connected
                  ? integrationProgress.hint
                  : t('github.card.connectHint')}
              </p>
            </div>
          </div>
          {connected ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant={orgStatus.variant}>{orgStatus.label}</Badge>
            </div>
          ) : null}
        </div>

        {connected ? (
          <div className="space-y-4">
            {attributes.githubOrgLastError ? (
              <div className="border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
                  {t('common.syncError')}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-terminal-text/80">
                  {attributes.githubOrgLastError}
                </p>
                <p className="mt-2 text-xs text-terminal-text/50">
                  {t('common.syncErrorHint')}
                </p>
              </div>
            ) : null}

            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label={t('common.username')}
                value={attributes.githubUsername}
                href={
                  attributes.githubUsername
                    ? githubProfileUrl(attributes.githubUsername)
                    : undefined
                }
              />
              {attributes.githubConnectedAt ? (
                <DetailItem
                  label={t('common.since')}
                  value={formatDate(attributes.githubConnectedAt, dateLocale)}
                />
              ) : null}
              {attributes.githubOrgInvitedAt ? (
                <DetailItem
                  label={t('github.card.invitedAt')}
                  value={formatDate(attributes.githubOrgInvitedAt, dateLocale)}
                />
              ) : null}
            </dl>

            {githubTeams.length > 0 ? (
              <div>
                <p className="meta-label">
                  {t('github.card.teams')}
                  <span className="ml-1 tabular-nums">
                    ({githubTeams.length})
                  </span>
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {visibleTeams.map(team => (
                    <li key={team} className="min-w-0 max-w-full">
                      <Badge
                        variant="secondary"
                        className="max-w-full truncate"
                      >
                        {team}
                      </Badge>
                    </li>
                  ))}
                </ul>
                {hasMoreTeams ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto px-0 py-0 text-xs font-medium text-terminal-text/55 hover:bg-transparent hover:text-terminal-green"
                    onClick={() => setTeamsExpanded(expanded => !expanded)}
                  >
                    {teamsExpanded
                      ? t('common.showLess')
                      : t('common.showMore', { count: hiddenTeamCount })}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {canSyncTeams ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSyncingTeams}
                  onClick={() => {
                    void handleSyncTeams()
                  }}
                >
                  <RefreshCw
                    className={isSyncingTeams ? 'animate-spin' : undefined}
                  />
                  {isSyncingTeams ? t('common.syncing') : t('common.sync')}
                </Button>
              ) : null}
              {showInvitationLink ? (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={githubOrgInvitationUrl(githubOrg)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('github.card.openInvite')}
                  </a>
                </Button>
              ) : null}
              <IntegrationOverflowMenu
                reconnectHref={ROUTES.GITHUB_CONNECT}
                reconnectLabel={t('github.card.reconnect')}
                reconnectIcon={<GitHubIcon className="text-inherit" />}
                disconnectTitle={t('github.disconnect.title')}
                disconnectDescription={t('github.disconnect.description')}
                disconnectOpen={disconnectOpen}
                onDisconnectOpenChange={setDisconnectOpen}
                isDisconnecting={isDisconnecting}
                onDisconnect={() => {
                  void handleDisconnect()
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            <Button variant="outline" asChild>
              <a href={ROUTES.GITHUB_CONNECT}>{t('github.card.connect')}</a>
            </Button>
          </div>
        )}
      </div>
    </TerminalPanel>
  )
}

function DetailItem({
  label,
  value,
  href,
}: {
  label: string
  value: string | null
  href?: string
}) {
  return (
    <div>
      <dt className="meta-label">{label}</dt>
      <dd className="mt-0.5 break-all text-sm text-terminal-text">
        {href && value ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-terminal-green"
          >
            {value}
          </a>
        ) : (
          (value ?? '-')
        )}
      </dd>
    </div>
  )
}
