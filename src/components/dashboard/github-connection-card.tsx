import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Link2Off } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { GitHubIcon } from '#/components/icons/github-icon'
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
  getGitHubOrgStatusDisplay,
  githubOrgInvitationUrl,
  githubProfileUrl,
} from '#/lib/integrations/github/org-status-display'
import { formatDate } from '#/lib/utils'
import { disconnectGitHubFn } from '#/server/disconnect-github'

type GitHubConnectionCardProps = {
  connected: boolean
  attributes: UserAttributes
  githubOrg: string | null
}

export function GitHubConnectionCard({
  connected,
  attributes,
  githubOrg,
}: GitHubConnectionCardProps) {
  const router = useRouter()
  const disconnectGitHub = useServerFn(disconnectGitHubFn)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const orgStatus = getGitHubOrgStatusDisplay(attributes.githubOrgStatus)
  const showInvitationLink =
    connected && attributes.githubOrgStatus === 'invited' && githubOrg !== null

  async function handleDisconnect() {
    setIsDisconnecting(true)

    try {
      await disconnectGitHub()
      toast.success('GitHub-Verbindung getrennt.')
      setDisconnectOpen(false)
      await router.invalidate()
    } catch {
      toast.error('GitHub-Verbindung konnte nicht getrennt werden.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <TerminalPanel title="GitHub">
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-card">
              <GitHubIcon className="size-5" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-terminal-lightGreen">
                {connected && attributes.githubUsername ? (
                  <a
                    href={githubProfileUrl(attributes.githubUsername)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-terminal-cyan"
                  >
                    @{attributes.githubUsername}
                  </a>
                ) : (
                  'Teil der GitHub-Organisation werden'
                )}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-terminal-text/50">
                {connected
                  ? 'Verbunden für Org-Zugang'
                  : 'Verbinde, um eingeladen zu werden.'}
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
                <p className="font-mono text-[10px] uppercase tracking-wider text-destructive-foreground/70">
                  Sync-Fehler
                </p>
                <p className="mt-1 font-mono text-xs leading-relaxed text-terminal-text/80">
                  {attributes.githubOrgLastError}
                </p>
                <p className="mt-2 text-xs text-terminal-text/50">
                  Bei anhaltenden Problemen den Admin kontaktieren.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Username"
                  value={attributes.githubUsername}
                  href={
                    attributes.githubUsername
                      ? githubProfileUrl(attributes.githubUsername)
                      : undefined
                  }
                />
                <DetailItem label="ID" value={attributes.githubId} />
                {attributes.githubConnectedAt ? (
                  <DetailItem
                    label="Seit"
                    value={formatDate(attributes.githubConnectedAt)}
                  />
                ) : null}
                {attributes.githubOrgInvitedAt ? (
                  <DetailItem
                    label="Eingeladen"
                    value={formatDate(attributes.githubOrgInvitedAt)}
                  />
                ) : null}
              </dl>

              <div className="flex shrink-0 flex-wrap gap-2">
                {showInvitationLink ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={githubOrgInvitationUrl(githubOrg)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Einladung öffnen
                    </a>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" asChild>
                  <a href={ROUTES.GITHUB_CONNECT}>
                    <GitHubIcon className="text-inherit" />
                    Neu verbinden
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
                        GitHub-Verbindung trennen?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Der Org-Zugang kann dabei entfallen.
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
          </div>
        ) : (
          <div>
            <Button asChild>
              <a href={ROUTES.GITHUB_CONNECT}>Mit GitHub verbinden</a>
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
