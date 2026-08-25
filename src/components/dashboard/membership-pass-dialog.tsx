import { ArrowUpRight, Smartphone } from 'lucide-react'
import { toDataURL } from 'qrcode'
import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { EXTERNAL_LINKS } from '#/lib/constants'

type MembershipPassDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MembershipPassDialog({
  open,
  onOpenChange,
}: MembershipPassDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    void toDataURL(EXTERNAL_LINKS.NEULAND_NEXT_MEMBER_DEEPLINK, {
      margin: 1,
      width: 220,
      color: {
        dark: '#0b1d14',
        light: '#fafcfa',
      },
      errorCorrectionLevel: 'M',
    }).then(url => {
      if (!cancelled) {
        setQrDataUrl(url)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terminal-text/45">
            Neuland Next
          </p>
          <DialogTitle>Mitgliedsausweis öffnen</DialogTitle>
          <DialogDescription>
            Scanne den QR-Code mit dem Handy, um den Ausweis in der App zu
            öffnen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 border border-terminal-window-border/70 bg-terminal-bg p-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR-Code zum Mitgliedsausweis"
              width={220}
              height={220}
              className="h-auto w-full max-w-[220px]"
            />
          ) : (
            <div
              className="flex aspect-square w-full max-w-[220px] items-center justify-center"
              aria-hidden
            >
              <Smartphone className="size-8 text-terminal-text/35" />
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="w-full sm:flex-1" asChild>
            <a
              href={EXTERNAL_LINKS.NEULAND_NEXT_MEMBER}
              target="_blank"
              rel="noopener noreferrer"
            >
              Im Browser öffnen
              <ArrowUpRight />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
