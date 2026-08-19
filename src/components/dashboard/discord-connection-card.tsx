import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Link2Off, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { INTEGRATION_CARD_IDS } from '#/components/dashboard/dashboard-action-banner'
import { IntegrationProgressInline } from '#/components/dashboard/integration-progress-inline'
import { DiscordIcon } from '#/components/icons/discord-icon'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import type { UserAttributes } from '#/lib/authentik/types'
import { ROUTES } from '#/lib/constants'
import {
  discordProfileUrl,
  getDiscordGuildStatusDisplay,
  isDiscordInGuild,
} from '#/lib/integrations/discord/guild-status-display'
import { buildDiscordIntegrationProgress } from '#/lib/integrations/discord/integration-progress'
import { formatDate } from '#/lib/utils'
import { disconnectDiscordFn } from '#/server/disconnect-discord'
import { syncDiscordRolesFn } from '#/server/sync-discord-roles'

const VISIBLE_ROLE_LIMIT = 4

type DiscordConnectionCardProps = {
  connected: boolean
  attributes: UserAttributes
  roleSyncEnabled: boolean
  discordRoles: string[]
}

export function DiscordConnectionCard({
  connected,
  attributes,
  roleSyncEnabled,
  discordRoles,
}: DiscordConnectionCardProps) {
  const router = useRouter()
  const disconnectDiscord = useServerFn(disconnectDiscordFn)
  const syncDiscordRoles = useServerFn(syncDiscordRolesFn)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSyncingRoles, setIsSyncingRoles] = useState(false)
  const [rolesExpanded, setRolesExpanded] = useState(false)
  const guildStatus = getDiscordGuildStatusDisplay(
    attributes.discordGuildStatus,
  )
  const inGuild = isDiscordInGuild(attributes.discordGuildStatus)
  const hasMoreRoles = discordRoles.length > VISIBLE_ROLE_LIMIT
  const visibleRoles =
    rolesExpanded || !hasMoreRoles
      ? discordRoles
      : discordRoles.slice(0, VISIBLE_ROLE_LIMIT)
  const hiddenRoleCount = discordRoles.length - visibleRoles.length
  const canSyncRoles = connected && roleSyncEnabled && inGuild
  const integrationProgress = buildDiscordIntegrationProgress({
    connected,
    discordGuildStatus: attributes.discordGuildStatus,
    roleSyncEnabled,
  })

  async function handleDisconnect() {
    setIsDisconnecting(true)

    try {
      await disconnectDiscord()
      toast.success('Discord-Verbindung getrennt.')
      setDisconnectOpen(false)
      await router.invalidate()
    } catch {
      toast.error('Discord-Verbindung konnte nicht getrennt werden.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  async function handleSyncRoles() {
    setIsSyncingRoles(true)

    try {
      const result = await syncDiscordRoles()
      const parts: string[] = []
      if (result.added.length > 0) {
        parts.push(`+${result.added.join(', ')}`)
      }
      if (result.removed.length > 0) {
        parts.push(`−${result.removed.join(', ')}`)
      }

      if (parts.length > 0) {
        toast.success(`Rollen aktualisiert (${parts.join('; ')}).`)
      } else {
        toast.success('Rollen sind bereits aktuell.')
      }

      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Rollen konnten nicht synchronisiert werden.',
      )
      // Sync may clear stale guild status in Authentik before failing.
      await router.invalidate()
    } finally {
      setIsSyncingRoles(false)
    }
  }

  return (
    <TerminalPanel
      title="Discord"
      titleAside={
        <IntegrationProgressInline
          steps={integrationProgress.steps}
          isComplete={integrationProgress.isComplete}
        />
      }
    >
      <div
        id={INTEGRATION_CARD_IDS.discord}
        className="space-y-4 p-4 scroll-mt-24"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-card">
              <DiscordIcon className="size-5" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-terminal-lightGreen">
                {connected && attributes.discordUsername ? (
                  <a
                    href={
                      attributes.discordId
                        ? discordProfileUrl(attributes.discordId)
                        : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-terminal-cyan"
                  >
                    @{attributes.discordUsername}
                  </a>
                ) : (
                  'Discord verbinden'
                )}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-terminal-text/50">
                {connected
                  ? integrationProgress.hint
                  : 'Verbinde für Serverbeitritt, Rollen-Sync und Linked Roles.'}
              </p>
            </div>
          </div>
          {connected ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant={guildStatus.variant}>{guildStatus.label}</Badge>
            </div>
          ) : null}
        </div>

        {connected ? (
          <div className="space-y-4">
            {attributes.discordGuildLastError ? (
              <div className="border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-destructive-foreground/70">
                  Sync-Fehler
                </p>
                <p className="mt-1 font-mono text-xs leading-relaxed text-terminal-text/80">
                  {attributes.discordGuildLastError}
                </p>
                <p className="mt-2 text-xs text-terminal-text/50">
                  Bei anhaltenden Problemen den Admin kontaktieren.
                </p>
              </div>
            ) : null}

            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Username"
                value={attributes.discordUsername}
                href={
                  attributes.discordId
                    ? discordProfileUrl(attributes.discordId)
                    : undefined
                }
              />
              {attributes.discordConnectedAt ? (
                <DetailItem
                  label="Seit"
                  value={formatDate(attributes.discordConnectedAt)}
                />
              ) : null}
              {inGuild && attributes.discordGuildJoinedAt ? (
                <DetailItem
                  label="Im Server seit"
                  value={formatDate(attributes.discordGuildJoinedAt)}
                />
              ) : null}
            </dl>

            {inGuild && discordRoles.length > 0 ? (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-terminal-text/40">
                  Discord-Rollen
                  <span className="ml-1 text-terminal-text/25">
                    ({discordRoles.length})
                  </span>
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {visibleRoles.map(role => (
                    <li key={role} className="min-w-0 max-w-full">
                      <Badge
                        variant="secondary"
                        className="max-w-full truncate"
                      >
                        {role}
                      </Badge>
                    </li>
                  ))}
                </ul>
                {hasMoreRoles ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto px-0 py-0 font-mono text-[11px] text-terminal-text/50 hover:bg-transparent hover:text-terminal-cyan"
                    onClick={() => setRolesExpanded(expanded => !expanded)}
                  >
                    {rolesExpanded
                      ? 'Weniger anzeigen'
                      : `+${hiddenRoleCount} weitere`}
                  </Button>
                ) : null}
              </div>
            ) : inGuild && roleSyncEnabled ? (
              <p className="text-xs leading-relaxed text-terminal-text/50">
                Keine Vereinsgruppen mit Discord-Rollen-Mapping gefunden. In
                Authentik braucht die Gruppe das Attribut{' '}
                <span className="font-mono">discord_role</span> und du musst
                Mitglied dieser Gruppe sein.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {canSyncRoles ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSyncingRoles}
                  onClick={() => {
                    void handleSyncRoles()
                  }}
                >
                  <RefreshCw
                    className={isSyncingRoles ? 'animate-spin' : undefined}
                  />
                  {isSyncingRoles
                    ? 'Synchronisiere…'
                    : 'Rollen synchronisieren'}
                </Button>
              ) : null}
              <Button
                variant={inGuild ? 'outline' : 'default'}
                size="sm"
                asChild
              >
                <a href={ROUTES.DISCORD_CONNECT}>
                  <DiscordIcon className="text-inherit" />
                  {inGuild ? 'Neu verbinden' : 'Erneut beitreten'}
                </a>
              </Button>
              <AlertDialog
                open={disconnectOpen}
                onOpenChange={setDisconnectOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDisconnecting}
                  >
                    <Link2Off />
                    Trennen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Discord-Verbindung trennen?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Du bleibst im Discord-Server, verlierst aber alle Rollen.
                      Connect vergisst die Verknüpfung.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDisconnecting}>
                      Abbrechen
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isDisconnecting}
                      onClick={event => {
                        event.preventDefault()
                        void handleDisconnect()
                      }}
                    >
                      {isDisconnecting ? 'Trennen…' : 'Trennen'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div>
            <Button asChild>
              <a href={ROUTES.DISCORD_CONNECT}>Mit Discord verbinden</a>
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
      <dt className="font-mono text-[10px] uppercase tracking-wider text-terminal-text/40">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm text-terminal-text">
        {href && value ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-terminal-cyan"
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
