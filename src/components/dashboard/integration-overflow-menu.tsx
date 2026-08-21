import { Ellipsis, Link2Off } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

type IntegrationOverflowMenuProps = {
  reconnectHref: string
  reconnectLabel: string
  reconnectIcon: ReactNode
  disconnectTitle: string
  disconnectDescription: string
  disconnectOpen: boolean
  onDisconnectOpenChange: (open: boolean) => void
  isDisconnecting: boolean
  onDisconnect: () => void
}

export function IntegrationOverflowMenu({
  reconnectHref,
  reconnectLabel,
  reconnectIcon,
  disconnectTitle,
  disconnectDescription,
  disconnectOpen,
  onDisconnectOpenChange,
  isDisconnecting,
  onDisconnect,
}: IntegrationOverflowMenuProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Weitere Aktionen"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={reconnectHref}>
              {reconnectIcon}
              {reconnectLabel}
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            disabled={isDisconnecting}
            onSelect={() => onDisconnectOpenChange(true)}
          >
            <Link2Off />
            Trennen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={disconnectOpen} onOpenChange={onDisconnectOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{disconnectTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {disconnectDescription}
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
                onDisconnect()
              }}
            >
              {isDisconnecting ? 'Trennen…' : 'Trennen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
