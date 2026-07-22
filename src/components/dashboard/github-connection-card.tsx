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
import { formatDate } from '#/lib/utils'
import { disconnectGitHubFn } from '#/server/disconnect-github'

type GitHubConnectionCardProps = {
  connected: boolean
  attributes: UserAttributes
}

export function GitHubConnectionCard({
  connected,
  attributes,
}: GitHubConnectionCardProps) {
  const router = useRouter()
  const disconnectGitHub = useServerFn(disconnectGitHubFn)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

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
                {connected && attributes.githubUsername
                  ? `@${attributes.githubUsername}`
                  : 'Organisation'}
              </p>
              <p className="mt-0.5 text-xs text-terminal-text/50">
                {connected
                  ? 'Verbunden für Org-Zugang'
                  : 'Einmal verbinden, dann automatisch einladen'}
              </p>
            </div>
          </div>
          <Badge variant={connected ? 'success' : 'muted'}>
            {connected ? 'Verbunden' : 'Offen'}
          </Badge>
        </div>

        {connected ? (
          <div className="flex flex-col gap-4 border-t border-terminal-window-border pt-4 lg:flex-row lg:items-end lg:justify-between">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
              <DetailItem label="Username" value={attributes.githubUsername} />
              <DetailItem label="ID" value={attributes.githubId} />
              {attributes.githubConnectedAt ? (
                <DetailItem
                  label="Seit"
                  value={formatDate(attributes.githubConnectedAt)}
                />
              ) : null}
            </dl>

            <div className="flex shrink-0 flex-wrap gap-2">
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
        ) : (
          <div className="border-t border-terminal-window-border pt-4">
            <Button asChild>
              <a href={ROUTES.GITHUB_CONNECT}>
                <GitHubIcon className="text-inherit" />
                Mit GitHub verbinden
              </a>
            </Button>
          </div>
        )}
      </div>
    </TerminalPanel>
  )
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-terminal-text/40">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm text-terminal-text">
        {value ?? '—'}
      </dd>
    </div>
  )
}
